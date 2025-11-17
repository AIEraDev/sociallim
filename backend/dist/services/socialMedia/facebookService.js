"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookService = exports.FacebookService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const socialMedia_1 = require("../../types/socialMedia");
const logger_1 = require("../../utils/logger");
class FacebookService {
    constructor(appId = process.env.FACEBOOK_APP_ID, appSecret = process.env.FACEBOOK_APP_SECRET) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.platform = client_1.Platform.FACEBOOK;
        this.baseUrl = "https://graph.facebook.com/v18.0";
        this.authUrl = "https://www.facebook.com/v18.0/dialog/oauth";
        this.tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
        this.redirectUri = process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5628/api/oauth/facebook/callback";
        this.rateLimitInfo = {
            remaining: 200,
            resetTime: new Date(Date.now() + 60 * 60 * 1000),
            limit: 200,
        };
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.info(`Facebook API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        this.apiClient.interceptors.response.use((response) => {
            const remaining = response.headers["x-app-usage"];
            if (remaining) {
                try {
                    const usage = JSON.parse(remaining);
                    this.rateLimitInfo.remaining = Math.max(0, 100 - (usage.call_count || 0));
                }
                catch (e) {
                }
            }
            logger_1.logger.info(`Facebook API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
            return response;
        }, (error) => {
            this.handleApiError(error);
            return Promise.reject(error);
        });
    }
    generateAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            state: state,
            scope: ["public_profile", "email", "pages_show_list", "pages_read_engagement", "instagram_basic", "instagram_manage_insights", "pages_read_user_content"].join(","),
            response_type: "code",
        });
        return `${this.authUrl}?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            client_id: this.appId,
            client_secret: this.appSecret,
            redirect_uri: this.redirectUri,
            code: code,
        });
        const response = await axios_1.default.get(`${this.tokenUrl}?${params.toString()}`);
        return response.data;
    }
    async getLongLivedToken(shortLivedToken) {
        const params = new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortLivedToken,
        });
        const response = await axios_1.default.get(`${this.tokenUrl}?${params.toString()}`);
        return response.data;
    }
    async fetchUserInfo(accessToken) {
        try {
            const response = await this.apiClient.get("/me", {
                params: {
                    fields: "id,name,email,picture",
                    access_token: accessToken,
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error("Error fetching Facebook user info:", error);
            throw this.transformError(error);
        }
    }
    async getUserPages(accessToken) {
        try {
            const response = await this.apiClient.get("/me/accounts", {
                params: {
                    fields: "id,name,access_token,category,tasks,instagram_business_account",
                    access_token: accessToken,
                },
            });
            return response.data.data;
        }
        catch (error) {
            logger_1.logger.error("Error fetching Facebook pages:", error);
            throw this.transformError(error);
        }
    }
    async getInstagramAccount(instagramAccountId, pageAccessToken) {
        try {
            const response = await this.apiClient.get(`/${instagramAccountId}`, {
                params: {
                    fields: "id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website",
                    access_token: pageAccessToken,
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching Instagram account ${instagramAccountId}:`, error);
            throw this.transformError(error);
        }
    }
    async getAllInstagramAccounts(accessToken) {
        try {
            const pages = await this.getUserPages(accessToken);
            const instagramAccounts = [];
            for (const page of pages) {
                if (page.instagram_business_account) {
                    try {
                        const instagram = await this.getInstagramAccount(page.instagram_business_account.id, page.access_token);
                        instagramAccounts.push({ page, instagram });
                    }
                    catch (error) {
                        logger_1.logger.warn(`Failed to fetch Instagram for page ${page.name}:`, error);
                    }
                }
            }
            return instagramAccounts;
        }
        catch (error) {
            logger_1.logger.error("Error fetching Instagram accounts:", error);
            throw this.transformError(error);
        }
    }
    async fetchUserPosts(accessToken, options = {}) {
        try {
            const { limit = 25, pageToken } = options;
            const params = {
                fields: "id,message,story,created_time,permalink_url,full_picture,attachments{media}",
                access_token: accessToken,
                limit: Math.min(limit, 25),
            };
            if (pageToken) {
                params.after = pageToken;
            }
            const response = await this.apiClient.get("/me/posts", { params });
            const facebookPosts = response.data.data || [];
            const posts = facebookPosts.map((post) => ({
                id: post.id,
                title: post.message || post.story || "Facebook Post",
                url: post.permalink_url || `https://facebook.com/${post.id}`,
                publishedAt: new Date(post.created_time),
                platform: client_1.Platform.FACEBOOK,
                thumbnailUrl: post.full_picture || post.attachments?.data?.[0]?.media?.image?.src,
                description: post.message || post.story,
            }));
            const pagination = {
                nextPageToken: response.data.paging?.cursors?.after,
                totalResults: undefined,
                resultsPerPage: facebookPosts.length,
            };
            logger_1.logger.info(`Fetched ${posts.length} Facebook posts for user`);
            return { posts, pagination };
        }
        catch (error) {
            logger_1.logger.error("Error fetching Facebook posts:", error);
            throw this.transformError(error);
        }
    }
    async fetchPostComments(accessToken, postId, options = {}) {
        try {
            const { limit = 25, pageToken } = options;
            const params = {
                fields: "id,message,created_time,from,like_count",
                access_token: accessToken,
                limit: Math.min(limit, 25),
            };
            if (pageToken) {
                params.after = pageToken;
            }
            const response = await this.apiClient.get(`/${postId}/comments`, { params });
            const facebookComments = response.data.data || [];
            const comments = facebookComments.map((comment) => ({
                id: comment.id,
                text: comment.message,
                authorName: comment.from.name,
                publishedAt: new Date(comment.created_time),
                likeCount: comment.like_count || 0,
            }));
            const pagination = {
                nextPageToken: response.data.paging?.cursors?.after,
                totalResults: undefined,
                resultsPerPage: facebookComments.length,
            };
            logger_1.logger.info(`Fetched ${comments.length} comments for Facebook post ${postId}`);
            return { comments, pagination };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching Facebook comments for post ${postId}:`, error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            const response = await this.apiClient.get("/me", {
                params: {
                    fields: "id",
                    access_token: accessToken,
                },
            });
            if (response.status === 200 && response.data.id) {
                return true;
            }
            const debugResponse = await axios_1.default.get("https://graph.facebook.com/debug_token", {
                params: {
                    input_token: accessToken,
                    access_token: `${this.appId}|${this.appSecret}`,
                },
            });
            return debugResponse.data.data.is_valid;
        }
        catch (error) {
            logger_1.logger.warn("Facebook token validation failed:", error);
            return false;
        }
    }
    async revokeToken(accessToken) {
        try {
            await this.apiClient.delete("/me/permissions", {
                params: {
                    access_token: accessToken,
                },
            });
            logger_1.logger.info("Facebook token revoked successfully");
        }
        catch (error) {
            logger_1.logger.error("Error revoking Facebook token:", error);
            throw this.transformError(error);
        }
    }
    async getRateLimitInfo(accessToken) {
        return { ...this.rateLimitInfo };
    }
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 400) {
            if (data?.error?.code === 190) {
                logger_1.logger.warn("Facebook API authentication failed - token may be expired");
            }
        }
        else if (status === 403) {
            logger_1.logger.warn("Facebook API access forbidden - check permissions");
        }
        else if (status === 429) {
            this.rateLimitInfo.remaining = 0;
            this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 60 * 1000);
            logger_1.logger.warn("Facebook API rate limit exceeded");
        }
        logger_1.logger.error(`Facebook API Error: ${status} - ${data?.error?.message || error.message}`);
    }
    transformError(error) {
        if (error instanceof socialMedia_1.ApiError) {
            return error;
        }
        const axiosError = error;
        const status = axiosError.response?.status || 500;
        const data = axiosError.response?.data;
        let code = "UNKNOWN_ERROR";
        let message = "An unknown error occurred";
        if (data?.error) {
            code = data.error.code?.toString() || "API_ERROR";
            message = data.error.message || message;
        }
        else {
            message = axiosError.message || message;
        }
        return new socialMedia_1.ApiError({
            code,
            message,
            status,
            platform: client_1.Platform.FACEBOOK,
        });
    }
}
exports.FacebookService = FacebookService;
let _facebookServiceInstance = null;
exports.facebookService = {
    get instance() {
        if (!_facebookServiceInstance) {
            _facebookServiceInstance = new FacebookService();
        }
        return _facebookServiceInstance;
    },
};
//# sourceMappingURL=facebookService.js.map