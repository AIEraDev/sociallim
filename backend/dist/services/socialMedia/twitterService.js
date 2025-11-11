"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitterService = exports.TwitterService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const socialMedia_1 = require("../../types/socialMedia");
const logger_1 = require("../../utils/logger");
class TwitterService {
    constructor() {
        this.platform = client_1.Platform.TWITTER;
        this.baseUrl = "https://api.twitter.com/2";
        this.rateLimitInfo = {
            remaining: 300,
            resetTime: new Date(Date.now() + 15 * 60 * 1000),
            limit: 300,
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
            logger_1.logger.info(`Twitter API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        this.apiClient.interceptors.response.use((response) => {
            const remaining = response.headers["x-rate-limit-remaining"];
            const resetTime = response.headers["x-rate-limit-reset"];
            if (remaining) {
                this.rateLimitInfo.remaining = parseInt(remaining);
            }
            if (resetTime) {
                this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
            }
            logger_1.logger.info(`Twitter API Response: ${response.status} - Rate limit remaining: ${this.rateLimitInfo.remaining}`);
            return response;
        }, (error) => {
            this.handleApiError(error);
            return Promise.reject(error);
        });
    }
    async fetchUserPosts(accessToken, options = {}) {
        try {
            const { limit = 100, pageToken, maxResults = 100 } = options;
            const userResponse = await this.apiClient.get("/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const userId = userResponse.data.data.id;
            const params = {
                "tweet.fields": "created_at,public_metrics,text",
                "user.fields": "id,name,username",
                max_results: Math.min(limit, maxResults, 100),
                exclude: "retweets,replies",
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
            const tweets = response.data.data || [];
            const posts = tweets.map((tweet) => ({
                id: tweet.id,
                title: tweet.text.length > 50 ? `${tweet.text.substring(0, 47)}...` : tweet.text,
                url: `https://twitter.com/user/status/${tweet.id}`,
                publishedAt: new Date(tweet.created_at),
                platform: client_1.Platform.TWITTER,
                description: tweet.text,
                viewCount: tweet.public_metrics?.quote_count,
                likeCount: tweet.public_metrics?.like_count,
            }));
            const pagination = {
                nextPageToken: response.data.meta?.next_token,
                totalResults: response.data.meta?.result_count,
                resultsPerPage: tweets.length,
            };
            logger_1.logger.info(`Fetched ${posts.length} Twitter posts for user`);
            return { posts, pagination };
        }
        catch (error) {
            logger_1.logger.error("Error fetching Twitter posts:", error);
            throw this.transformError(error);
        }
    }
    async fetchPostComments(accessToken, postId, options = {}) {
        try {
            const { limit = 100, pageToken, maxResults = 100 } = options;
            const params = {
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
            const replies = response.data.data || [];
            const users = response.data.includes?.users || [];
            const userMap = new Map(users.map((user) => [user.id, user.username]));
            const comments = replies
                .filter((reply) => reply.id !== postId)
                .map((reply) => ({
                id: reply.id,
                text: reply.text,
                authorName: userMap.get(reply.author_id) || `User ${reply.author_id}`,
                publishedAt: new Date(reply.created_at),
                likeCount: reply.public_metrics?.like_count || 0,
                replyCount: reply.public_metrics?.reply_count,
            }));
            const pagination = {
                nextPageToken: response.data.meta?.next_token,
                totalResults: response.data.meta?.result_count,
                resultsPerPage: comments.length,
            };
            logger_1.logger.info(`Fetched ${comments.length} replies for Twitter post ${postId}`);
            return { comments, pagination };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching Twitter replies for post ${postId}:`, error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            const response = await this.apiClient.get("/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.status === 200 && !!response.data.data?.id;
        }
        catch (error) {
            logger_1.logger.warn("Twitter token validation failed:", error);
            return false;
        }
    }
    async getRateLimitInfo(accessToken) {
        try {
            const response = await this.apiClient.get("/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const remaining = response.headers["x-rate-limit-remaining"];
            const resetTime = response.headers["x-rate-limit-reset"];
            if (remaining) {
                this.rateLimitInfo.remaining = parseInt(remaining);
            }
            if (resetTime) {
                this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
            }
            return { ...this.rateLimitInfo };
        }
        catch (error) {
            return { ...this.rateLimitInfo };
        }
    }
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 401) {
            logger_1.logger.warn("Twitter API authentication failed - token may be expired");
        }
        else if (status === 403) {
            logger_1.logger.warn("Twitter API access forbidden - check account status and permissions");
        }
        else if (status === 429) {
            const resetTime = error.response?.headers?.["x-rate-limit-reset"];
            if (resetTime) {
                this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000);
            }
            this.rateLimitInfo.remaining = 0;
            logger_1.logger.warn("Twitter API rate limit exceeded");
        }
        logger_1.logger.error(`Twitter API Error: ${status} - ${data?.title || data?.detail || error.message}`);
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
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            code = data.errors[0].code || "API_ERROR";
            message = data.errors[0].message || data.title || message;
        }
        else if (data?.title) {
            code = "API_ERROR";
            message = data.title;
        }
        else {
            message = axiosError.message || message;
        }
        const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;
        return new socialMedia_1.ApiError({
            code,
            message,
            status,
            platform: client_1.Platform.TWITTER,
            retryAfter,
        });
    }
}
exports.TwitterService = TwitterService;
let _twitterServiceInstance = null;
exports.twitterService = {
    get instance() {
        if (!_twitterServiceInstance) {
            _twitterServiceInstance = new TwitterService();
        }
        return _twitterServiceInstance;
    },
};
//# sourceMappingURL=twitterService.js.map