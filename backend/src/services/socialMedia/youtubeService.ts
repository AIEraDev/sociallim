import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, YouTubeVideo, YouTubeComment, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";

export class YouTubeService implements ISocialMediaService {
  public readonly platform = Platform.YOUTUBE;
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = "https://www.googleapis.com/youtube/v3";

  // Rate limiting tracking
  private rateLimitInfo: RateLimitInfo = {
    remaining: 10000, // YouTube API quota units per day
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset daily
    limit: 10000,
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
        logger.info(`YouTube API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and rate limit tracking
    this.apiClient.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers if available
        const quotaUsed = response.headers["x-goog-api-quota-used"];
        if (quotaUsed) {
          this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.limit - parseInt(quotaUsed));
        }

        logger.info(`YouTube API Response: ${response.status} - Quota remaining: ${this.rateLimitInfo.remaining}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch user's YouTube videos
   */
  async fetchUserPosts(
    accessToken: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    try {
      const { limit = 50, pageToken, maxResults = 50 } = options;

      // First, get the user's channel ID
      const channelResponse = await this.apiClient.get("/channels", {
        params: {
          part: "id,snippet",
          mine: true,
          access_token: accessToken,
        },
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new ApiError({
          code: "NO_CHANNEL",
          message: "No YouTube channel found for this user",
          status: 404,
          platform: Platform.YOUTUBE,
        });
      }

      const channelId = channelResponse.data.items[0].id;

      // Get the uploads playlist ID
      const uploadsPlaylistId = channelResponse.data.items[0].snippet?.customUrl ? `UU${channelId.substring(2)}` : `UU${channelId.substring(2)}`;

      // Fetch videos from uploads playlist
      const videosResponse = await this.apiClient.get("/playlistItems", {
        params: {
          part: "snippet,contentDetails",
          playlistId: uploadsPlaylistId,
          maxResults: Math.min(limit, maxResults),
          pageToken,
          access_token: accessToken,
        },
      });

      // Get detailed video information including statistics
      const videoIds = videosResponse.data.items.map((item: any) => item.contentDetails.videoId);

      let detailedVideos: YouTubeVideo[] = [];
      if (videoIds.length > 0) {
        const detailsResponse = await this.apiClient.get("/videos", {
          params: {
            part: "snippet,statistics",
            id: videoIds.join(","),
            access_token: accessToken,
          },
        });
        detailedVideos = detailsResponse.data.items || [];
      }

      // Transform to our standard format
      const posts: SocialMediaPost[] = detailedVideos.map((video: YouTubeVideo) => ({
        id: video.id,
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        publishedAt: new Date(video.snippet.publishedAt),
        platform: Platform.YOUTUBE,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
        description: video.snippet.description,
        viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
        likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : undefined,
      }));

      const pagination: PaginationInfo = {
        nextPageToken: videosResponse.data.nextPageToken,
        totalResults: videosResponse.data.pageInfo?.totalResults,
        resultsPerPage: videosResponse.data.pageInfo?.resultsPerPage,
      };

      logger.info(`Fetched ${posts.length} YouTube videos for user`);
      return { posts, pagination };
    } catch (error) {
      logger.error("Error fetching YouTube posts:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch comments for a specific YouTube video
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
      const { limit = 100, pageToken, maxResults = 100, order = "time" } = options;

      const response = await this.apiClient.get("/commentThreads", {
        params: {
          part: "snippet,replies",
          videoId: postId,
          maxResults: Math.min(limit, maxResults),
          order,
          pageToken,
          access_token: accessToken,
        },
      });

      const commentThreads = response.data.items || [];
      const comments: SocialMediaComment[] = [];

      // Process top-level comments and replies
      for (const thread of commentThreads) {
        const topComment = thread.snippet.topLevelComment;

        // Add top-level comment
        comments.push({
          id: topComment.id,
          text: topComment.snippet.textDisplay,
          authorName: topComment.snippet.authorDisplayName,
          publishedAt: new Date(topComment.snippet.publishedAt),
          likeCount: topComment.snippet.likeCount || 0,
        });

        // Add replies if they exist
        if (thread.replies && thread.replies.comments) {
          for (const reply of thread.replies.comments) {
            comments.push({
              id: reply.id,
              text: reply.snippet.textDisplay,
              authorName: reply.snippet.authorDisplayName,
              publishedAt: new Date(reply.snippet.publishedAt),
              likeCount: reply.snippet.likeCount || 0,
              parentCommentId: topComment.id,
            });
          }
        }
      }

      const pagination: PaginationInfo = {
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults,
        resultsPerPage: response.data.pageInfo?.resultsPerPage,
      };

      logger.info(`Fetched ${comments.length} comments for YouTube video ${postId}`);
      return { comments, pagination };
    } catch (error) {
      logger.error(`Error fetching YouTube comments for video ${postId}:`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Validate YouTube access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.get("/channels", {
        params: {
          part: "id",
          mine: true,
          access_token: accessToken,
        },
      });

      return response.status === 200 && response.data.items && response.data.items.length > 0;
    } catch (error) {
      logger.warn("YouTube token validation failed:", error);
      return false;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    // YouTube doesn't provide real-time quota info, so we return our tracked info
    return { ...this.rateLimitInfo };
  }

  /**
   * Handle API errors and implement retry logic
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    if (status === 403) {
      // Quota exceeded or forbidden
      if (data?.error?.errors?.[0]?.reason === "quotaExceeded") {
        this.rateLimitInfo.remaining = 0;
        this.rateLimitInfo.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset in 24 hours
      }
    } else if (status === 401) {
      // Invalid or expired token
      logger.warn("YouTube API authentication failed - token may be expired");
    } else if (status === 429) {
      // Rate limited
      const retryAfter = error.response?.headers["retry-after"];
      if (retryAfter) {
        this.rateLimitInfo.resetTime = new Date(Date.now() + parseInt(retryAfter) * 1000);
      }
    }

    logger.error(`YouTube API Error: ${status} - ${data?.error?.message || error.message}`);
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
      code = data.error.errors?.[0]?.reason || data.error.code || "API_ERROR";
      message = data.error.message || message;
    } else {
      message = axiosError.message || message;
    }

    // Add retry-after for rate limiting
    const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;

    return new ApiError({
      code,
      message,
      status,
      platform: Platform.YOUTUBE,
      retryAfter,
    });
  }
}

// Export singleton instance - lazy initialization to avoid test issues
let _youtubeServiceInstance: YouTubeService | null = null;

export const youtubeService = {
  get instance(): YouTubeService {
    if (!_youtubeServiceInstance) {
      _youtubeServiceInstance = new YouTubeService();
    }
    return _youtubeServiceInstance;
  },
};
