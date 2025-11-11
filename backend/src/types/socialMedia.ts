import { Platform } from "@prisma/client";

// Base interfaces for social media integration
export interface SocialMediaPost {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  platform: Platform;
  thumbnailUrl?: string;
  description?: string;
  viewCount?: number;
  likeCount?: number;
}

export interface SocialMediaComment {
  id: string;
  text: string;
  authorName: string;
  publishedAt: Date;
  likeCount: number;
  replyCount?: number;
  parentCommentId?: string;
}

export interface PaginationInfo {
  nextPageToken?: string;
  totalResults?: number;
  resultsPerPage?: number;
}

export interface FetchPostsOptions {
  limit?: number;
  pageToken?: string;
  maxResults?: number;
}

export interface FetchCommentsOptions {
  limit?: number;
  pageToken?: string;
  maxResults?: number;
  order?: "time" | "relevance";
}

// Platform-specific response types
export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    authorDisplayName: string;
    publishedAt: string;
    likeCount: number;
    parentId?: string;
  };
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  author_id: string;
}

export interface TwitterReply {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  in_reply_to_user_id: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export interface TikTokVideo {
  id: string;
  title: string;
  video_description: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

export interface TikTokComment {
  id: string;
  text: string;
  create_time: number;
  like_count: number;
  user: {
    display_name: string;
    username: string;
  };
}

// Rate limiting types
export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  limit: number;
}

export interface ApiErrorData {
  code: string;
  message: string;
  status: number;
  platform: Platform;
  retryAfter?: number;
}

export class ApiError extends Error implements ApiErrorData {
  public readonly code: string;
  public readonly status: number;
  public readonly platform: Platform;
  public readonly retryAfter?: number;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.name = "ApiError";
    this.code = data.code;
    this.status = data.status;
    this.platform = data.platform;
    this.retryAfter = data.retryAfter;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Base social media service interface
export interface ISocialMediaService {
  platform: Platform;
  fetchUserPosts(
    accessToken: string,
    options?: FetchPostsOptions
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }>;
  fetchPostComments(
    accessToken: string,
    postId: string,
    options?: FetchCommentsOptions
  ): Promise<{
    comments: SocialMediaComment[];
    pagination?: PaginationInfo;
  }>;
  validateToken(accessToken: string): Promise<boolean>;
  getRateLimitInfo(accessToken: string): Promise<RateLimitInfo>;
}
