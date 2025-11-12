import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: {
    data: Array<{
      media?: {
        image?: {
          src: string;
        };
      };
    }>;
  };
}

interface FacebookComment {
  id: string;
  message: string;
  created_time: string;
  from: {
    name: string;
    id: string;
  };
  like_count?: number;
}

export class FacebookService implements ISocialMediaService {
  public readonly platform = Platform.FACEBOOK;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://graph.facebook.com/v18.0";

  // Rate limiting tracking - Facebook has different limits for different endpoints
  private rateLimitInfo: RateLimitInfo = {
    remaining: 200, // Facebook Graph API has 200 calls per hour per user
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
        logger.info(`Facebook API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and rate limit tracking
    this.apiClient.interceptors.response.use(
      (response) => {
        // Facebook provides rate limit headers
        const remaining = response.headers["x-app-usage"];
        if (remaining) {
          try {
            const usage = JSON.parse(remaining);
            this.rateLimitInfo.remaining = Math.max(0, 100 - (usage.call_count || 0));
          } catch (e) {
            // Ignore parsing errors
          }
        }

        logger.info(`Facebook API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch Facebook user information
   */
  async fetchUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await this.apiClient.get("/me", {
        params: {
          fields: "id,name,email,picture",
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        pictureUrl: response.data.picture?.data?.url,
      };
    } catch (error) {
      logger.error("Error fetching Facebook user info:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch user's Facebook posts
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

      // Facebook Graph API endpoint for user posts
      const params: any = {
        fields: "id,message,story,created_time,permalink_url,full_picture,attachments{media}",
        access_token: accessToken,
        limit: Math.min(limit, 25), // Facebook limits to 25 per request
      };

      if (pageToken) {
        params.after = pageToken;
      }

      const response = await this.apiClient.get("/me/posts", { params });

      const facebookPosts: FacebookPost[] = response.data.data || [];

      // Transform to our standard format
      const posts: SocialMediaPost[] = facebookPosts.map((post: FacebookPost) => ({
        id: post.id,
        title: post.message || post.story || "Facebook Post",
        url: post.permalink_url || `https://facebook.com/${post.id}`,
        publishedAt: new Date(post.created_time),
        platform: Platform.FACEBOOK,
        thumbnailUrl: post.full_picture || post.attachments?.data?.[0]?.media?.image?.src,
        description: post.message || post.story,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.paging?.cursors?.after,
        totalResults: undefined, // Facebook doesn't provide total count
        resultsPerPage: facebookPosts.length,
      };

      logger.info(`Fetched ${posts.length} Facebook posts for user`);
      return { posts, pagination };
    } catch (error) {
      logger.error("Error fetching Facebook posts:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch comments for a specific Facebook post
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

      const params: any = {
        fields: "id,message,created_time,from,like_count",
        access_token: accessToken,
        limit: Math.min(limit, 25),
      };

      if (pageToken) {
        params.after = pageToken;
      }

      const response = await this.apiClient.get(`/${postId}/comments`, { params });

      const facebookComments: FacebookComment[] = response.data.data || [];

      // Transform to our standard format
      const comments: SocialMediaComment[] = facebookComments.map((comment: FacebookComment) => ({
        id: comment.id,
        text: comment.message,
        authorName: comment.from.name,
        publishedAt: new Date(comment.created_time),
        likeCount: comment.like_count || 0,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.paging?.cursors?.after,
        totalResults: undefined,
        resultsPerPage: facebookComments.length,
      };

      logger.info(`Fetched ${comments.length} comments for Facebook post ${postId}`);
      return { comments, pagination };
    } catch (error) {
      logger.error(`Error fetching Facebook comments for post ${postId}:`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate Facebook access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.get("/me", {
        params: {
          fields: "id",
          access_token: accessToken,
        },
      });

      return response.status === 200 && !!response.data.id;
    } catch (error) {
      logger.warn("Facebook token validation failed:", error);
      return false;
    }
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

    if (status === 400) {
      // Bad request - could be invalid parameters or expired token
      if (data?.error?.code === 190) {
        logger.warn("Facebook API authentication failed - token may be expired");
      }
    } else if (status === 403) {
      // Forbidden - could be permissions issue
      logger.warn("Facebook API access forbidden - check permissions");
    } else if (status === 429) {
      // Rate limited
      this.rateLimitInfo.remaining = 0;
      this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 60 * 1000); // Reset in 1 hour
      logger.warn("Facebook API rate limit exceeded");
    }

    logger.error(`Facebook API Error: ${status} - ${data?.error?.message || error.message}`);
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
      message = data.error.message || message;
    } else {
      message = axiosError.message || message;
    }

    return new ApiError({
      code,
      message,
      status,
      platform: Platform.FACEBOOK,
    });
  }
}

// Export singleton instance
let _facebookServiceInstance: FacebookService | null = null;

export const facebookService = {
  get instance(): FacebookService {
    if (!_facebookServiceInstance) {
      _facebookServiceInstance = new FacebookService();
    }
    return _facebookServiceInstance;
  },
};
