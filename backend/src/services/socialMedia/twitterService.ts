import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, TwitterTweet, TwitterReply, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

export class TwitterService implements ISocialMediaService {
  public readonly platform = Platform.TWITTER;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://api.twitter.com/2";

  // Rate limiting tracking - Twitter API v2 has different limits for different endpoints
  private rateLimitInfo: RateLimitInfo = {
    remaining: 300, // Twitter API v2 has 300 requests per 15 minutes for user timeline
    resetTime: new Date(Date.now() + 15 * 60 * 1000), // Reset every 15 minutes
    limit: 300,
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
    try {
      const { limit = 100, pageToken, maxResults = 100 } = options;

      // First, get the user's ID
      const userResponse = await this.apiClient.get("/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userId = userResponse.data.data.id;

      // Fetch user's tweets
      const params: any = {
        "tweet.fields": "created_at,public_metrics,text",
        "user.fields": "id,name,username",
        max_results: Math.min(limit, maxResults, 100), // Twitter limits to 100 per request
        exclude: "retweets,replies", // Only get original tweets
      };

      if (pageToken) {
        params.pagination_token = pageToken;
      }

      const response = await this.apiClient.get(`/users/${userId}/tweets`, {
        params,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const tweets: TwitterTweet[] = response.data.data || [];

      // Transform to our standard format
      const posts: SocialMediaPost[] = tweets.map((tweet: TwitterTweet) => ({
        id: tweet.id,
        title: tweet.text.length > 50 ? `${tweet.text.substring(0, 47)}...` : tweet.text,
        url: `https://twitter.com/user/status/${tweet.id}`,
        publishedAt: new Date(tweet.created_at),
        platform: Platform.TWITTER,
        description: tweet.text,
        viewCount: tweet.public_metrics?.quote_count,
        likeCount: tweet.public_metrics?.like_count,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.meta?.next_token,
        totalResults: response.data.meta?.result_count,
        resultsPerPage: tweets.length,
      };

      logger.info(`Fetched ${posts.length} Twitter posts for user`);
      return { posts, pagination };
    } catch (error) {
      logger.error("Error fetching Twitter posts:", error);
      throw this.transformError(error);
    }
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
    try {
      const { limit = 100, pageToken, maxResults = 100 } = options;

      // Search for replies to the specific tweet
      const params: any = {
        query: `conversation_id:${postId}`,
        "tweet.fields": "created_at,public_metrics,text,author_id,in_reply_to_user_id",
        "user.fields": "id,name,username",
        expansions: "author_id",
        max_results: Math.min(limit, maxResults, 100),
      };

      if (pageToken) {
        params.next_token = pageToken;
      }

      const response = await this.apiClient.get("/tweets/search/recent", {
        params,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const replies: TwitterReply[] = response.data.data || [];
      const users = response.data.includes?.users || [];

      // Create a map of user IDs to usernames for quick lookup
      const userMap = new Map<string, string>(users.map((user: any) => [user.id, user.username]));

      // Transform to our standard format, excluding the original tweet
      const comments: SocialMediaComment[] = replies
        .filter((reply: TwitterReply) => reply.id !== postId) // Exclude the original tweet
        .map((reply: TwitterReply) => ({
          id: reply.id,
          text: reply.text,
          authorName: userMap.get(reply.author_id) || `User ${reply.author_id}`,
          publishedAt: new Date(reply.created_at),
          likeCount: reply.public_metrics?.like_count || 0,
          replyCount: reply.public_metrics?.reply_count,
        }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.meta?.next_token,
        totalResults: response.data.meta?.result_count,
        resultsPerPage: comments.length,
      };

      logger.info(`Fetched ${comments.length} replies for Twitter post ${postId}`);
      return { comments, pagination };
    } catch (error) {
      logger.error(`Error fetching Twitter replies for post ${postId}:`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate Twitter access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.get("/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.status === 200 && !!response.data.data?.id;
    } catch (error) {
      logger.warn("Twitter token validation failed:", error);
      return false;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    try {
      // Twitter provides rate limit info in response headers, but we can also check explicitly
      const response = await this.apiClient.get("/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update from headers if available
      const remaining = response.headers["x-rate-limit-remaining"];
      const resetTime = response.headers["x-rate-limit-reset"];

      if (remaining) {
        this.rateLimitInfo.remaining = parseInt(remaining);
      }
      if (resetTime) {
        this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
      }

      return { ...this.rateLimitInfo };
    } catch (error) {
      // Return cached info if API call fails
      return { ...this.rateLimitInfo };
    }
  }

  /**
   * Handle API errors and implement retry logic
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    if (status === 401) {
      // Unauthorized - invalid or expired token
      logger.warn("Twitter API authentication failed - token may be expired");
    } else if (status === 403) {
      // Forbidden - could be suspended account or insufficient permissions
      logger.warn("Twitter API access forbidden - check account status and permissions");
    } else if (status === 429) {
      // Rate limited
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
      // Twitter API v2 error format
      code = data.errors[0].code || "API_ERROR";
      message = data.errors[0].message || data.title || message;
    } else if (data?.title) {
      // Twitter API v2 simple error format
      code = "API_ERROR";
      message = data.title;
    } else {
      message = axiosError.message || message;
    }

    // Add retry-after for rate limiting
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

// Export singleton instance - lazy initialization to avoid test issues
let _twitterServiceInstance: TwitterService | null = null;

export const twitterService = {
  get instance(): TwitterService {
    if (!_twitterServiceInstance) {
      _twitterServiceInstance = new TwitterService();
    }
    return _twitterServiceInstance;
  },
};
