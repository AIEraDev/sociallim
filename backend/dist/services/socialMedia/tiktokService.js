"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokService = exports.TikTokService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const socialMedia_1 = require("../../types/socialMedia");
const logger_1 = require("../../utils/logger");
class TikTokService {
    constructor() {
        this.platform = client_1.Platform.TIKTOK;
        this.baseUrl = "https://open.tiktokapis.com/v2";
        this.rateLimitInfo = {
            remaining: 1000,
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            limit: 1000,
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
            logger_1.logger.info(`TikTok API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        this.apiClient.interceptors.response.use((response) => {
            const remaining = response.headers["x-tt-logid"] ? this.rateLimitInfo.remaining - 1 : this.rateLimitInfo.remaining;
            this.rateLimitInfo.remaining = Math.max(0, remaining);
            logger_1.logger.info(`TikTok API Response: ${response.status} - Requests remaining: ${this.rateLimitInfo.remaining}`);
            return response;
        }, (error) => {
            this.handleApiError(error);
            return Promise.reject(error);
        });
    }
    async fetchUserPosts(accessToken, options = {}) {
        try {
            const { limit = 20, pageToken } = options;
            const params = {
                fields: "id,title,video_description,create_time,cover_image_url,share_url,view_count,like_count,comment_count",
                max_count: Math.min(limit, 20),
            };
            if (pageToken) {
                params.cursor = pageToken;
            }
            const response = await this.apiClient.post("/video/list/", params, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const videos = response.data.data?.videos || [];
            const posts = videos.map((video) => ({
                id: video.id,
                title: video.title || video.video_description || "TikTok Video",
                url: video.share_url,
                publishedAt: new Date(video.create_time * 1000),
                platform: client_1.Platform.TIKTOK,
                thumbnailUrl: video.cover_image_url,
                description: video.video_description,
                viewCount: video.view_count,
                likeCount: video.like_count,
            }));
            const pagination = {
                nextPageToken: response.data.data?.cursor,
                totalResults: undefined,
                resultsPerPage: videos.length,
            };
            logger_1.logger.info(`Fetched ${posts.length} TikTok videos for user`);
            return { posts, pagination };
        }
        catch (error) {
            logger_1.logger.error("Error fetching TikTok posts:", error);
            throw this.transformError(error);
        }
    }
    async fetchPostComments(accessToken, postId, options = {}) {
        try {
            const { limit = 20, pageToken } = options;
            const params = {
                video_id: postId,
                fields: "id,text,create_time,like_count,user",
                max_count: Math.min(limit, 20),
            };
            if (pageToken) {
                params.cursor = pageToken;
            }
            const response = await this.apiClient.post("/video/comment/list/", params, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const tiktokComments = response.data.data?.comments || [];
            const comments = tiktokComments.map((comment) => ({
                id: comment.id,
                text: comment.text,
                authorName: comment.user?.display_name || comment.user?.username || "TikTok User",
                publishedAt: new Date(comment.create_time * 1000),
                likeCount: comment.like_count || 0,
            }));
            const pagination = {
                nextPageToken: response.data.data?.cursor,
                totalResults: undefined,
                resultsPerPage: tiktokComments.length,
            };
            logger_1.logger.info(`Fetched ${comments.length} comments for TikTok video ${postId}`);
            return { comments, pagination };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching TikTok comments for video ${postId}:`, error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            const response = await this.apiClient.post("/user/info/", {
                fields: "open_id,union_id,avatar_url,display_name",
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.status === 200 && !!response.data.data?.user?.open_id;
        }
        catch (error) {
            logger_1.logger.warn("TikTok token validation failed:", error);
            return false;
        }
    }
    async getRateLimitInfo(accessToken) {
        return { ...this.rateLimitInfo };
    }
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 401) {
            logger_1.logger.warn("TikTok API authentication failed - token may be expired");
        }
        else if (status === 403) {
            logger_1.logger.warn("TikTok API access forbidden - check app permissions and approval status");
        }
        else if (status === 429) {
            this.rateLimitInfo.remaining = 0;
            this.rateLimitInfo.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            logger_1.logger.warn("TikTok API rate limit exceeded");
        }
        else if (status === 400) {
            logger_1.logger.warn("TikTok API bad request - check parameters");
        }
        logger_1.logger.error(`TikTok API Error: ${status} - ${data?.error?.message || data?.message || error.message}`);
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
            code = data.error.code || "API_ERROR";
            message = data.error.message || message;
        }
        else if (data?.message) {
            code = "API_ERROR";
            message = data.message;
        }
        else {
            message = axiosError.message || message;
        }
        const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;
        return new socialMedia_1.ApiError({
            code,
            message,
            status,
            platform: client_1.Platform.TIKTOK,
            retryAfter,
        });
    }
}
exports.TikTokService = TikTokService;
let _tiktokServiceInstance = null;
exports.tiktokService = {
    get instance() {
        if (!_tiktokServiceInstance) {
            _tiktokServiceInstance = new TikTokService();
        }
        return _tiktokServiceInstance;
    },
};
//# sourceMappingURL=tiktokService.js.map