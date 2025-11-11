import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, TikTokVideo, TikTokComment, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

export class TikTokService implements ISocialMediaService {
  public readonly platform = Platform.TIKTOK;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://open.tiktokapis.com/v2";

  // Rate limiting tracking - TikTok API has different limits for different endpoints
  private rateLimitInfo: RateLimitInfo = {
    remaining: 1000, // TikTok API has 1000 requests per day for video list
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset daily
    limit: 1000,
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
        logger.info(`TikTok API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and rate limit tracking
    this.apiClient.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers if available
        const remaining = response.headers["x-tt-logid"] ? this.rateLimitInfo.remaining - 1 : this.rateLimitInfo.remaining;
        this.rateLimitInfo.remaining = Math.max(0, remaining);

        logger.info(`TikTok API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch user's TikTok videos
   */
  async fetchUserPosts(
    accessToken: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    try {
      const { limit = 20, pageToken } = options;

      const params: any = {
        fields: "id,title,video_description,create_time,cover_image_url,share_url,view_count,like_count,comment_count",
        max_count: Math.min(limit, 20), // TikTok limits to 20 per request
      };

      if (pageToken) {
        params.cursor = pageToken;
      }

      const response = await this.apiClient.post("/video/list/", params, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const videos: TikTokVideo[] = response.data.data?.videos || [];

      // Transform to our standard format
      const posts: SocialMediaPost[] = videos.map((video: TikTokVideo) => ({
        id: video.id,
        title: video.title || video.video_description || "TikTok Video",
        url: video.share_url,
        publishedAt: new Date(video.create_time * 1000), // TikTok uses Unix timestamp
        platform: Platform.TIKTOK,
        thumbnailUrl: video.cover_image_url,
        description: video.video_description,
        viewCount: video.view_count,
        likeCount: video.like_count,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.data?.cursor,
        totalResults: undefined, // TikTok doesn't provide total count
        resultsPerPage: videos.length,
      };

      logger.info(`Fetched ${posts.length} TikTok videos for user`);
      return { posts, pagination };
    } catch (error) {
      logger.error("Error fetching TikTok posts:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch comments for a specific TikTok video
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
      const { limit = 20, pageToken } = options;

      const params: any = {
        video_id: postId,
        fields: "id,text,create_time,like_count,user",
        max_count: Math.min(limit, 20), // TikTok limits to 20 per request
      };

      if (pageToken) {
        params.cursor = pageToken;
      }

      const response = await this.apiClient.post("/video/comment/list/", params, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const tiktokComments: TikTokComment[] = response.data.data?.comments || [];

      // Transform to our standard format
      const comments: SocialMediaComment[] = tiktokComments.map((comment: TikTokComment) => ({
        id: comment.id,
        text: comment.text,
        authorName: comment.user?.display_name || comment.user?.username || "TikTok User",
        publishedAt: new Date(comment.create_time * 1000), // TikTok uses Unix timestamp
        likeCount: comment.like_count || 0,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: response.data.data?.cursor,
        totalResults: undefined,
        resultsPerPage: tiktokComments.length,
      };

      logger.info(`Fetched ${comments.length} comments for TikTok video ${postId}`);
      return { comments, pagination };
    } catch (error) {
      logger.error(`Error fetching TikTok comments for video ${postId}:`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate TikTok access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post(
        "/user/info/",
        {
          fields: "open_id,union_id,avatar_url,display_name",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.status === 200 && !!response.data.data?.user?.open_id;
    } catch (error) {
      logger.warn("TikTok token validation failed:", error);
      return false;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    // TikTok doesn't provide real-time rate limit info, so we return our tracked info
    return { ...this.rateLimitInfo };
  }

  /**
   * Handle API errors and implement retry logic
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    if (status === 401) {
      // Unauthorized - invalid or expired token
      logger.warn("TikTok API authentication failed - token may be expired");
    } else if (status === 403) {
      // Forbidden - could be permissions issue or app not approved
      logger.warn("TikTok API access forbidden - check app permissions and approval status");
    } else if (status === 429) {
      // Rate limited
      this.rateLimitInfo.remaining = 0;
      this.rateLimitInfo.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset in 24 hours
      logger.warn("TikTok API rate limit exceeded");
    } else if (status === 400) {
      // Bad request - could be invalid parameters
      logger.warn("TikTok API bad request - check parameters");
    }

    logger.error(`TikTok API Error: ${status} - ${data?.error?.message || data?.message || error.message}`);
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
      code = data.error.code || "API_ERROR";
      message = data.error.message || message;
    } else if (data?.message) {
      code = "API_ERROR";
      message = data.message;
    } else {
      message = axiosError.message || message;
    }

    // Add retry-after for rate limiting
    const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;

    return new ApiError({
      code,
      message,
      status,
      platform: Platform.TIKTOK,
      retryAfter,
    });
  }
}

// Export singleton instance - lazy initialization to avoid test issues
let _tiktokServiceInstance: TikTokService | null = null;

export const tiktokService = {
  get instance(): TikTokService {
    if (!_tiktokServiceInstance) {
      _tiktokServiceInstance = new TikTokService();
    }
    return _tiktokServiceInstance;
  },
};
