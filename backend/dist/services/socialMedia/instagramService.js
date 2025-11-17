"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagramService = exports.InstagramService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const socialMedia_1 = require("../../types/socialMedia");
const logger_1 = require("../../utils/logger");
class InstagramService {
    constructor() {
        this.platform = client_1.Platform.INSTAGRAM;
        this.baseUrl = "https://graph.instagram.com";
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
            logger_1.logger.info(`Instagram API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        this.apiClient.interceptors.response.use((response) => {
            this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.remaining - 1);
            logger_1.logger.info(`Instagram API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
            return response;
        }, (error) => {
            this.handleApiError(error);
            return Promise.reject(error);
        });
    }
    async fetchUserInfo(accessToken) {
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
        }
        catch (error) {
            logger_1.logger.error("Error fetching Instagram user info:", error);
            throw this.transformError(error);
        }
    }
    async fetchUserPosts(accessToken, options = {}) {
        try {
            const { limit = 25, pageToken } = options;
            const params = {
                fields: "id,caption,media_type,media_url,permalink,timestamp",
                access_token: accessToken,
                limit: Math.min(limit, 25),
            };
            if (pageToken) {
                params.after = pageToken;
            }
            const response = await this.apiClient.get("/me/media", { params });
            const instagramPosts = response.data.data || [];
            const posts = instagramPosts.map((post) => ({
                id: post.id,
                title: post.caption || "Instagram Post",
                url: post.permalink,
                publishedAt: new Date(post.timestamp),
                platform: client_1.Platform.INSTAGRAM,
                thumbnailUrl: post.media_url,
                description: post.caption,
            }));
            const pagination = {
                nextPageToken: response.data.paging?.next ? response.data.paging.cursors?.after : undefined,
                totalResults: undefined,
                resultsPerPage: instagramPosts.length,
            };
            logger_1.logger.info(`Fetched ${posts.length} Instagram posts for user`);
            return { posts, pagination };
        }
        catch (error) {
            logger_1.logger.error("Error fetching Instagram posts:", error);
            throw this.transformError(error);
        }
    }
    async fetchPostComments(accessToken, postId, options = {}) {
        try {
            const { limit = 25, pageToken } = options;
            const userResponse = await this.apiClient.get("/me", {
                params: {
                    fields: "account_type",
                    access_token: accessToken,
                },
            });
            const accountType = userResponse.data.account_type;
            if (accountType !== "BUSINESS") {
                logger_1.logger.warn("Instagram comments are only available for business accounts");
                return {
                    comments: [],
                    pagination: {
                        totalResults: 0,
                        resultsPerPage: 0,
                    },
                };
            }
            const params = {
                fields: "id,text,username,timestamp",
                access_token: accessToken,
                limit: Math.min(limit, 25),
            };
            if (pageToken) {
                params.after = pageToken;
            }
            const response = await this.apiClient.get(`/${postId}/comments`, { params });
            const instagramComments = response.data.data || [];
            const comments = instagramComments.map((comment) => ({
                id: comment.id,
                text: comment.text,
                authorName: comment.username,
                publishedAt: new Date(comment.timestamp),
                likeCount: 0,
            }));
            const pagination = {
                nextPageToken: response.data.paging?.cursors?.after,
                totalResults: undefined,
                resultsPerPage: instagramComments.length,
            };
            logger_1.logger.info(`Fetched ${comments.length} comments for Instagram post ${postId}`);
            return { comments, pagination };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching Instagram comments for post ${postId}:`, error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            const response = await this.apiClient.get("/me", {
                params: {
                    fields: "id,username",
                    access_token: accessToken,
                },
            });
            return response.status === 200 && !!response.data.id;
        }
        catch (error) {
            logger_1.logger.warn("Instagram token validation failed:", error);
            return false;
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
                logger_1.logger.warn("Instagram API authentication failed - token may be expired");
            }
        }
        else if (status === 403) {
            logger_1.logger.warn("Instagram API access forbidden - check permissions");
        }
        else if (status === 429) {
            this.rateLimitInfo.remaining = 0;
            this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 60 * 1000);
            logger_1.logger.warn("Instagram API rate limit exceeded");
        }
        logger_1.logger.error(`Instagram API Error: ${status} - ${data?.error?.message || error.message}`);
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
            message = data.error.message || data.error.error_user_msg || message;
        }
        else {
            message = axiosError.message || message;
        }
        const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;
        return new socialMedia_1.ApiError({
            code,
            message,
            status,
            platform: client_1.Platform.INSTAGRAM,
            retryAfter,
        });
    }
}
exports.InstagramService = InstagramService;
let _instagramServiceInstance = null;
exports.instagramService = {
    get instance() {
        if (!_instagramServiceInstance) {
            _instagramServiceInstance = new InstagramService();
        }
        return _instagramServiceInstance;
    },
};
//# sourceMappingURL=instagramService.js.map