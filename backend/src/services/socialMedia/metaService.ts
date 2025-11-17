import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "@prisma/client";
import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo, ApiError } from "../../types/socialMedia";
import { logger } from "../../utils/logger";
import { encrypt } from "../../utils/encryption";

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

// OAuth-related interfaces
interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks?: string[];
  instagram_business_account?: {
    id: string;
  };
}

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
  website?: string;
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookTokenDebug {
  data: {
    app_id: string;
    application: string;
    expires_at: number;
    is_valid: boolean;
    scopes: string[];
    user_id: string;
  };
}

export class MetaService implements ISocialMediaService {
  public readonly platform = Platform.FACEBOOK; // Primary platform for OAuth
  private readonly facebookApiClient: AxiosInstance;
  private readonly instagramApiClient: AxiosInstance;
  private readonly baseUrl = "https://graph.facebook.com/v18.0";
  private readonly instagramBaseUrl = "https://graph.instagram.com";
  private readonly authUrl = "https://www.facebook.com/v18.0/dialog/oauth";
  private readonly tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
  private readonly redirectUri: string = process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5628/api/oauth/facebook/callback";

  // Rate limiting tracking - Meta APIs have different limits for different endpoints
  private rateLimitInfo: RateLimitInfo = {
    remaining: 200, // Meta Graph API has 200 calls per hour per user
    resetTime: new Date(Date.now() + 60 * 60 * 1000), // Reset hourly
    limit: 200,
  };

  constructor(private appId: string = process.env.FACEBOOK_APP_ID!, private appSecret: string = process.env.FACEBOOK_APP_SECRET!) {
    // Facebook/Meta Graph API client
    this.facebookApiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Instagram Graph API client
    this.instagramApiClient = axios.create({
      baseURL: this.instagramBaseUrl,
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Add request interceptors for both clients
    [this.facebookApiClient, this.instagramApiClient].forEach((client, index) => {
      const clientName = index === 0 ? "Facebook" : "Instagram";

      client.interceptors.request.use(
        (config) => {
          logger.info(`Meta ${clientName} API Request: ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => Promise.reject(error)
      );

      client.interceptors.response.use(
        (response) => {
          // Facebook provides rate limit headers, Instagram doesn't
          if (index === 0) {
            const remaining = response.headers["x-app-usage"];
            if (remaining) {
              try {
                const usage = JSON.parse(remaining);
                this.rateLimitInfo.remaining = Math.max(0, 100 - (usage.call_count || 0));
              } catch (e) {
                // Ignore parsing errors
              }
            }
          } else {
            // For Instagram, track manually
            this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.remaining - 1);
          }

          logger.info(`Meta ${clientName} API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
          return response;
        },
        (error: AxiosError) => {
          this.handleApiError(error);
          return Promise.reject(error);
        }
      );
    });
  }

  /**
   * Generate Meta authorization URL (handles both Facebook and Instagram)
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: ["public_profile", "email"].join(","),
      response_type: "code",
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<FacebookTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });

    const response = await axios.get<FacebookTokenResponse>(`${this.tokenUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get long-lived access token (60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await axios.get<FacebookTokenResponse>(`${this.tokenUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Fetch Facebook user information
   */
  async fetchUserInfo(accessToken: string): Promise<FacebookUser> {
    try {
      const response = await this.facebookApiClient.get<FacebookUser>("/me", {
        params: {
          fields: "id,name,email,picture",
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      logger.error("Error fetching Meta user info:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Fetch Instagram user information
   */
  async fetchInstagramUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await this.instagramApiClient.get("/me", {
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
      throw this.transformError(error, Platform.INSTAGRAM);
    }
  }

  /**
   * Get user's Facebook Pages
   */
  async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await this.facebookApiClient.get<{ data: FacebookPage[] }>("/me/accounts", {
        params: {
          fields: "id,name,access_token,category,tasks,instagram_business_account",
          access_token: accessToken,
        },
      });

      return response.data.data;
    } catch (error) {
      logger.error("Error fetching Facebook pages:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Get Instagram Business Account details
   */
  async getInstagramAccount(instagramAccountId: string, pageAccessToken: string): Promise<InstagramAccount> {
    try {
      const response = await this.facebookApiClient.get<InstagramAccount>(`/${instagramAccountId}`, {
        params: {
          fields: "id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website",
          access_token: pageAccessToken,
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching Instagram account ${instagramAccountId}:`, error);
      throw this.transformError(error, Platform.INSTAGRAM);
    }
  }

  /**
   * Get all Instagram accounts connected to user's Pages
   */
  async getAllInstagramAccounts(accessToken: string): Promise<Array<{ page: FacebookPage; instagram: InstagramAccount }>> {
    try {
      const pages = await this.getUserPages(accessToken);
      const instagramAccounts: Array<{ page: FacebookPage; instagram: InstagramAccount }> = [];

      for (const page of pages) {
        if (page.instagram_business_account) {
          try {
            const instagram = await this.getInstagramAccount(page.instagram_business_account.id, page.access_token);
            instagramAccounts.push({ page, instagram });
          } catch (error) {
            logger.warn(`Failed to fetch Instagram for page ${page.name}:`, error);
          }
        }
      }

      return instagramAccounts;
    } catch (error) {
      logger.error("Error fetching Instagram accounts:", error);
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

      const response = await this.facebookApiClient.get("/me/posts", { params });

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
   * Fetch Instagram posts for a specific platform
   */
  async fetchInstagramPosts(
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

      const response = await this.instagramApiClient.get("/me/media", { params });

      const instagramPosts: any[] = response.data.data || [];

      // Transform to our standard format
      const posts: SocialMediaPost[] = instagramPosts.map((post: any) => ({
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
      throw this.transformError(error, Platform.INSTAGRAM);
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

      const response = await this.facebookApiClient.get(`/${postId}/comments`, { params });

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
   * Fetch comments for a specific Instagram post
   * Note: Instagram Basic Display API has very limited comment access
   * Comments are only available for business accounts and only for media owned by the app user
   */
  async fetchInstagramPostComments(
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
      const userResponse = await this.instagramApiClient.get("/me", {
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

      const response = await this.instagramApiClient.get(`/${postId}/comments`, { params });

      const instagramComments: any[] = response.data.data || [];

      // Transform to our standard format
      const comments: SocialMediaComment[] = instagramComments.map((comment: any) => ({
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
      throw this.transformError(error, Platform.INSTAGRAM);
    }
  }

  /**
   * Validate Meta access token (works for both Facebook and Instagram)
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // First try Facebook validation
      const response = await this.facebookApiClient.get("/me", {
        params: {
          fields: "id",
          access_token: accessToken,
        },
      });

      if (response.status === 200 && response.data.id) {
        return true;
      }

      // If simple validation fails, try debug token endpoint
      const debugResponse = await axios.get<FacebookTokenDebug>("https://graph.facebook.com/debug_token", {
        params: {
          input_token: accessToken,
          access_token: `${this.appId}|${this.appSecret}`,
        },
      });

      return debugResponse.data.data.is_valid;
    } catch (error) {
      logger.warn("Meta token validation failed:", error);
      return false;
    }
  }

  /**
   * Validate Instagram access token specifically
   */
  async validateInstagramToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.instagramApiClient.get("/me", {
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
   * Revoke Meta access token (revokes for both Facebook and Instagram)
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.facebookApiClient.delete("/me/permissions", {
        params: {
          access_token: accessToken,
        },
      });
      logger.info("Meta token revoked successfully");
    } catch (error) {
      logger.error("Error revoking Meta token:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<RateLimitInfo> {
    return { ...this.rateLimitInfo };
  }

  /**
   * Get posts from both Facebook and Instagram for a user
   */
  async getAllUserPosts(
    facebookAccessToken: string,
    instagramAccessToken?: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    const allPosts: SocialMediaPost[] = [];
    let totalResults = 0;

    try {
      // Fetch Facebook posts
      const facebookResult = await this.fetchUserPosts(facebookAccessToken, options);
      allPosts.push(...facebookResult.posts);
      totalResults += facebookResult.posts.length;

      // Fetch Instagram posts if token is provided
      if (instagramAccessToken) {
        const instagramResult = await this.fetchInstagramPosts(instagramAccessToken, options);
        allPosts.push(...instagramResult.posts);
        totalResults += instagramResult.posts.length;
      }

      // Sort by published date (newest first)
      allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      return {
        posts: allPosts,
        pagination: {
          totalResults,
          resultsPerPage: allPosts.length,
        },
      };
    } catch (error) {
      logger.error("Error fetching all user posts:", error);
      throw this.transformError(error);
    }
  }

  /**
   * Get platform-specific posts based on platform parameter
   */
  async getPlatformPosts(
    platform: Platform,
    accessToken: string,
    options: FetchPostsOptions = {}
  ): Promise<{
    posts: SocialMediaPost[];
    pagination?: PaginationInfo;
  }> {
    switch (platform) {
      case Platform.FACEBOOK:
        return this.fetchUserPosts(accessToken, options);
      case Platform.INSTAGRAM:
        return this.fetchInstagramPosts(accessToken, options);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get platform-specific comments based on platform parameter
   */
  async getPlatformComments(
    platform: Platform,
    accessToken: string,
    postId: string,
    options: FetchCommentsOptions = {}
  ): Promise<{
    comments: SocialMediaComment[];
    pagination?: PaginationInfo;
  }> {
    switch (platform) {
      case Platform.FACEBOOK:
        return this.fetchPostComments(accessToken, postId, options);
      case Platform.INSTAGRAM:
        return this.fetchInstagramPostComments(accessToken, postId, options);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
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
        logger.warn("Meta API authentication failed - token may be expired");
      }
    } else if (status === 403) {
      // Forbidden - could be permissions issue
      logger.warn("Meta API access forbidden - check permissions");
    } else if (status === 429) {
      // Rate limited
      this.rateLimitInfo.remaining = 0;
      this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 60 * 1000); // Reset in 1 hour
      logger.warn("Meta API rate limit exceeded");
    }

    logger.error(`Meta API Error: ${status} - ${data?.error?.message || error.message}`);
  }

  /**
   * Transform axios errors to our standard ApiError format
   */
  private transformError(error: any, platform: Platform = Platform.FACEBOOK): ApiError {
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
      platform,
      retryAfter,
    });
  }
}

// Export singleton instance
let _metaServiceInstance: MetaService | null = null;

export const metaService = {
  get instance(): MetaService {
    if (!_metaServiceInstance) {
      _metaServiceInstance = new MetaService();
    }
    return _metaServiceInstance;
  },
};
