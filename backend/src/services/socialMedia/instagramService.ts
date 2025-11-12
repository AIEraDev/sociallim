import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, InstagramPost, InstagramComment, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

export class InstagramService implements ISocialMediaService {
  public readonly platform = Platform.INSTAGRAM;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://graph.instagram.com";

  // Rate limiting tracking - Instagram has different limits for different endpoints
  private rateLimitInfo: RateLimitInfo = {
    remaining: 200, // Instagram Basic Display API has 200 requests per hour per user
    resetTime: new Date(Date.now() + 60 * 60 * 1000), // Reset hourly
    limit: 200,
  };

  constructor() {
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
        logger.info(`Instagram API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and rate limit tracking
    this.apiClient.interceptors.response.use(
      (response) => {
        // Instagram doesn't provide rate limit headers, so we track manually
        this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.remaining - 1);

        logger.info(`Instagram API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch Instagram user information
   */
  async fetchUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await this.apiClient.get("/me", {
        params: {
          fields: "id,username,account_type,media_count",
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        username: response.data.username,
        accountType: response.data.account_type,
        mediaCount: response.data.media_count,
      };
    } catch (error) {
      logger.error("Error fetching Instagram user info:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch user's Instagram posts
   */
  async fetchUserPosts(
    accessToken: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    try {
      const { limit = 25, pageToken } = options;

      // Instagram Basic Display API endpoint for user media
      const params: any = {
        fields: "id,caption,media_type,media_url,permalink,timestamp",
        access_token: accessToken,
        limit: Math.min(limit, 25), // Instagram limits to 25 per request
      };

      if (pageToken) {
        params.after = pageToken;
      }

      const response = await this.apiClient.get("/me/media", { params });

      const instagramPosts: InstagramPost[] = response.data.data || [];

      // Transform to our standard format
      const posts: SocialMediaPost[] = instagramPosts.map((post: InstagramPost) => ({
        id: post.id,
        title: post.caption || "Instagram Post",
        url: post.permalink,
        publishedAt: new Date(post.timestamp),
        platform: Platform.INSTAGRAM,
        thumbnailUrl: post.media_url,
        description: post.caption,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.paging?.next ? response.data.paging.cursors?.after : undefined,
        totalResults: undefined, // Instagram doesn't provide total count
        resultsPerPage: instagramPosts.length,
      };

      logger.info(`Fetched ${posts.length} Instagram posts for user`);
      return { posts, pagination };
    } catch (error) {
      logger.error("Error fetching Instagram posts:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch comments for a specific Instagram post
   * Note: Instagram Basic Display API has very limited comment access
   * Comments are only available for business accounts and only for media owned by the app user
   */
  async fetchPostComments(
    accessToken: string,
    postId: string,
    options: FetchCommentsOptions = {}
  ): Promise<{
    comments: SocialMediaComment[];
    pagination?: PaginationInfo;
  }> {
    try {
      const { limit = 25, pageToken } = options;

      // Check if this is a business account first
      const userResponse = await this.apiClient.get("/me", {
        params: {
          fields: "account_type",
          access_token: accessToken,
        },
      });

      const accountType = userResponse.data.account_type;

      // Instagram Basic Display API doesn't support comments for personal accounts
      if (accountType !== "BUSINESS") {
        logger.warn("Instagram comments are only available for business accounts");
        return {
          comments: [],
          pagination: {
            totalResults: 0,
            resultsPerPage: 0,
          },
        };
      }

      const params: any = {
        fields: "id,text,username,timestamp",
        access_token: accessToken,
        limit: Math.min(limit, 25),
      };

      if (pageToken) {
        params.after = pageToken;
      }

      const response = await this.apiClient.get(`/${postId}/comments`, { params });

      const instagramComments: InstagramComment[] = response.data.data || [];

      // Transform to our standard format
      const comments: SocialMediaComment[] = instagramComments.map((comment: InstagramComment) => ({
        id: comment.id,
        text: comment.text,
        authorName: comment.username,
        publishedAt: new Date(comment.timestamp),
        likeCount: 0, // Instagram Basic Display API doesn't provide like counts for comments
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.paging?.cursors?.after,
        totalResults: undefined,
        resultsPerPage: instagramComments.length,
      };

      logger.info(`Fetched ${comments.length} comments for Instagram post ${postId}`);
      return { comments, pagination };
    } catch (error) {
      logger.error(`Error fetching Instagram comments for post ${postId}:`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate Instagram access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.get("/me", {
        params: {
          fields: "id,username",
          access_token: accessToken,
        },
      });

      return response.status === 200 && !!response.data.id;
    } catch (error) {
      logger.warn("Instagram token validation failed:", error);
      return false;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    // Instagram doesn't provide real-time rate limit info, so we return our tracked info
    return { ...this.rateLimitInfo };
  }

  /**
   * Handle API errors and implement retry logic
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    if (status === 400) {
      // Bad request - could be invalid parameters or expired token
      if (data?.error?.code === 190) {
        logger.warn("Instagram API authentication failed - token may be expired");
      }
    } else if (status === 403) {
      // Forbidden - could be permissions issue
      logger.warn("Instagram API access forbidden - check permissions");
    } else if (status === 429) {
      // Rate limited
      this.rateLimitInfo.remaining = 0;
      this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 60 * 1000); // Reset in 1 hour
      logger.warn("Instagram API rate limit exceeded");
    }

    logger.error(`Instagram API Error: ${status} - ${data?.error?.message || error.message}`);
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

    if (data?.error) {
      code = data.error.code?.toString() || "API_ERROR";
      message = data.error.message || data.error.error_user_msg || message;
    } else {
      message = axiosError.message || message;
    }

    // Add retry-after for rate limiting
    const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;

    return new ApiError({
      code,
      message,
      status,
      platform: Platform.INSTAGRAM,
      retryAfter,
    });
  }
}

// Export singleton instance - lazy initialization to avoid test issues
let _instagramServiceInstance: InstagramService | null = null;

export const instagramService = {
  get instance(): InstagramService {
    if (!_instagramServiceInstance) {
      _instagramServiceInstance = new InstagramService();
    }
    return _instagramServiceInstance;
  },
};
