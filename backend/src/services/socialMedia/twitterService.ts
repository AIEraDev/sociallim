import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  verified?: boolean;
}

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export class TwitterService implements ISocialMediaService {
  public readonly platform = Platform.TWITTER;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://api.twitter.com/2";
  private readonly authUrl = "https://twitter.com/i/oauth2/authorize";
  private readonly tokenUrl = "https://api.twitter.com/2/oauth2/token";

  // Twitter OAuth 2.0 credentials
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  // Rate limiting tracking - Twitter API v2 has different limits for different endpoints
  private rateLimitInfo = {
    remaining: 300, // Twitter API v2 has 300 requests per 15 minutes for user timeline
    resetTime: new Date(Date.now() + 15 * 60 * 1000), // Reset every 15 minutes
    limit: 300,
  };

  constructor() {
    // Initialize Twitter OAuth 2.0 credentials from environment
    this.clientId = process.env.TWITTER_CLIENT_ID!;
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    this.callbackUrl = process.env.TWITTER_CALLBACK_URL || `${process.env.BACKEND_URL}/api/oauth/callback/twitter`;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Twitter OAuth 2.0 credentials are required: TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET");
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for rate limiting
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.info(`Twitter API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and rate limit tracking
    this.apiClient.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers
        const remaining = response.headers["x-rate-limit-remaining"];
        const resetTime = response.headers["x-rate-limit-reset"];

        if (remaining) {
          this.rateLimitInfo.remaining = parseInt(remaining);
        }
        if (resetTime) {
          this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
        }

        logger.info(`Twitter API Response: ${response.status} - Rate limit remaining: ${this.rateLimitInfo.remaining}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /*** Generate Twitter OAuth authorization URL */
  generateAuthUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: "tweet.read users.read follows.read offline.access",
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /*** Exchange authorization code for access token */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TwitterTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.callbackUrl,
      code_verifier: codeVerifier,
      client_id: this.clientId,
    });

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await axios.post<TwitterTokenResponse>(this.tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
    });

    return response.data;
  }

  /*** Fetch authenticated user information */
  async fetchUserInfo(accessToken: string): Promise<any> {
    try {
      console.log("Making Twitter API request with OAuth 2.0 User Context");
      const response = await this.apiClient.get("/users/me", {
        params: {
          "user.fields": "id,name,username,description,public_metrics,profile_image_url,verified",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const user = response.data.data;
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        verified: user.verified,
        followersCount: user.public_metrics?.followers_count,
        followingCount: user.public_metrics?.following_count,
        tweetCount: user.public_metrics?.tweet_count,
        listedCount: user.public_metrics?.listed_count,
      };
    } catch (error) {
      logger.error("Error fetching Twitter user info:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate Twitter access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      console.log("TwitterService: Validating OAuth 2.0 User Access Token...");
      const response = await this.apiClient.get("/users/me", {
        params: {
          "user.fields": "id",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Twitter API response:", {
        status: response.status,
        hasData: !!response.data,
        hasUserId: !!response.data?.data?.id,
      });

      return response.status === 200 && !!response.data.data?.id;
    } catch (error: any) {
      console.error("Twitter token validation failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      logger.warn("Twitter token validation failed:", error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitterTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientId,
    });

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await axios.post<TwitterTokenResponse>(this.tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
    });

    return response.data;
  }

  /**
   * Fetch user's Twitter posts (tweets)
   */
  async fetchUserPosts(
    accessToken: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    // Implementation would go here - for now return empty
    return { posts: [] };
  }

  /**
   * Fetch replies/comments for a specific Twitter post
   */
  async fetchPostComments(
    accessToken: string,
    postId: string,
    options: FetchCommentsOptions = {}
  ): Promise<{
    comments: SocialMediaComment[];
    pagination?: PaginationInfo;
  }> {
    // Implementation would go here - for now return empty
    return { comments: [] };
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    return { ...this.rateLimitInfo };
  }

  /**
   * Handle API errors and implement retry logic
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    if (status === 401) {
      logger.warn("Twitter API authentication failed - token may be expired");
    } else if (status === 403) {
      logger.warn("Twitter API access forbidden - check account status and permissions");
    } else if (status === 429) {
      const resetTime = error.response?.headers?.["x-rate-limit-reset"];
      if (resetTime) {
        this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
      }
      this.rateLimitInfo.remaining = 0;
      logger.warn("Twitter API rate limit exceeded");
    }

    logger.error(`Twitter API Error: ${status} - ${data?.title || data?.detail || error.message}`);
  }

  /**
   * Transform axios errors to our standard ApiError format
   */
  private transformError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 500;
    const data = axiosError.response?.data as any;

    let code = "UNKNOWN_ERROR";
    let message = "An unknown error occurred";

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      code = data.errors[0].code || "API_ERROR";
      message = data.errors[0].message || data.title || message;
    } else if (data?.title) {
      code = "API_ERROR";
      message = data.title;
    } else {
      message = axiosError.message || message;
    }

    const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;

    return new ApiError({
      code,
      message,
      status,
      platform: Platform.TWITTER,
      retryAfter,
    });
  }
}

let _twitterServiceInstance: TwitterService | null = null;

export const twitterService = {
  get instance(): TwitterService {
    if (!_twitterServiceInstance) {
      _twitterServiceInstance = new TwitterService();
    }
    return _twitterServiceInstance;
  },
};
