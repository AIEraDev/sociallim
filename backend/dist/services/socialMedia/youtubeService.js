"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeService = exports.YouTubeService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const socialMedia_1 = require("../../types/socialMedia");
const logger_1 = require("../../utils/logger");
class YouTubeService {
    constructor() {
        this.platform = client_1.Platform.YOUTUBE;
        this.baseUrl = "https://www.googleapis.com/youtube/v3";
        this.rateLimitInfo = {
            remaining: 10000,
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            limit: 10000,
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
            logger_1.logger.info(`YouTube API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        this.apiClient.interceptors.response.use((response) => {
            const quotaUsed = response.headers["x-goog-api-quota-used"];
            if (quotaUsed) {
                this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.limit - parseInt(quotaUsed));
            }
            logger_1.logger.info(`YouTube API Response: ${response.status} - Quota remaining: ${this.rateLimitInfo.remaining}`);
            return response;
        }, (error) => {
            this.handleApiError(error);
            return Promise.reject(error);
        });
    }
    async fetchUserInfo(accessToken) {
        try {
            const response = await this.apiClient.get("/channels", {
                params: {
                    part: "snippet,statistics",
                    mine: true,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const channel = response.data.items?.[0];
            if (!channel) {
                throw new Error("No channel found for user");
            }
            return {
                id: channel.id,
                title: channel.snippet?.title,
                description: channel.snippet?.description,
                thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
                subscriberCount: channel.statistics?.subscriberCount,
                videoCount: channel.statistics?.videoCount,
                viewCount: channel.statistics?.viewCount,
            };
        }
        catch (error) {
            logger_1.logger.error("Error fetching YouTube user info:", error);
            throw this.transformError(error);
        }
    }
    async fetchUserPosts(accessToken, options = {}) {
        try {
            const { limit = 50, pageToken, maxResults = 50 } = options;
            const channelResponse = await this.apiClient.get("/channels", {
                params: {
                    part: "id,snippet",
                    mine: true,
                    access_token: accessToken,
                },
            });
            if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
                throw new socialMedia_1.ApiError({
                    code: "NO_CHANNEL",
                    message: "No YouTube channel found for this user",
                    status: 404,
                    platform: client_1.Platform.YOUTUBE,
                });
            }
            const channelId = channelResponse.data.items[0].id;
            const uploadsPlaylistId = channelResponse.data.items[0].snippet?.customUrl ? `UU${channelId.substring(2)}` : `UU${channelId.substring(2)}`;
            const videosResponse = await this.apiClient.get("/playlistItems", {
                params: {
                    part: "snippet,contentDetails",
                    playlistId: uploadsPlaylistId,
                    maxResults: Math.min(limit, maxResults),
                    pageToken,
                    access_token: accessToken,
                },
            });
            const videoIds = videosResponse.data.items.map((item) => item.contentDetails.videoId);
            let detailedVideos = [];
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
            const posts = detailedVideos.map((video) => ({
                id: video.id,
                title: video.snippet.title,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                publishedAt: new Date(video.snippet.publishedAt),
                platform: client_1.Platform.YOUTUBE,
                thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
                description: video.snippet.description,
                viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
                likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : undefined,
            }));
            const pagination = {
                nextPageToken: videosResponse.data.nextPageToken,
                totalResults: videosResponse.data.pageInfo?.totalResults,
                resultsPerPage: videosResponse.data.pageInfo?.resultsPerPage,
            };
            logger_1.logger.info(`Fetched ${posts.length} YouTube videos for user`);
            return { posts, pagination };
        }
        catch (error) {
            logger_1.logger.error("Error fetching YouTube posts:", error);
            throw this.transformError(error);
        }
    }
    async fetchPostComments(accessToken, postId, options = {}) {
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
            const comments = [];
            for (const thread of commentThreads) {
                const topComment = thread.snippet.topLevelComment;
                comments.push({
                    id: topComment.id,
                    text: topComment.snippet.textDisplay,
                    authorName: topComment.snippet.authorDisplayName,
                    publishedAt: new Date(topComment.snippet.publishedAt),
                    likeCount: topComment.snippet.likeCount || 0,
                });
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
            const pagination = {
                nextPageToken: response.data.nextPageToken,
                totalResults: response.data.pageInfo?.totalResults,
                resultsPerPage: response.data.pageInfo?.resultsPerPage,
            };
            logger_1.logger.info(`Fetched ${comments.length} comments for YouTube video ${postId}`);
            return { comments, pagination };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching YouTube comments for video ${postId}:`, error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            const response = await this.apiClient.get("/channels", {
                params: {
                    part: "id",
                    mine: true,
                    access_token: accessToken,
                },
            });
            return response.status === 200 && response.data.items && response.data.items.length > 0;
        }
        catch (error) {
            logger_1.logger.warn("YouTube token validation failed:", error);
            return false;
        }
    }
    async getRateLimitInfo(accessToken) {
        return { ...this.rateLimitInfo };
    }
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 403) {
            if (data?.error?.errors?.[0]?.reason === "quotaExceeded") {
                this.rateLimitInfo.remaining = 0;
                this.rateLimitInfo.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
        }
        else if (status === 401) {
            logger_1.logger.warn("YouTube API authentication failed - token may be expired");
        }
        else if (status === 429) {
            const retryAfter = error.response?.headers["retry-after"];
            if (retryAfter) {
                this.rateLimitInfo.resetTime = new Date(Date.now() + parseInt(retryAfter) * 1000);
            }
        }
        logger_1.logger.error(`YouTube API Error: ${status} - ${data?.error?.message || error.message}`);
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
            code = data.error.errors?.[0]?.reason || data.error.code || "API_ERROR";
            message = data.error.message || message;
        }
        else {
            message = axiosError.message || message;
        }
        const retryAfter = axiosError.response?.headers?.["retry-after"] ? parseInt(axiosError.response.headers["retry-after"]) : undefined;
        return new socialMedia_1.ApiError({
            code,
            message,
            status,
            platform: client_1.Platform.YOUTUBE,
            retryAfter,
        });
    }
}
exports.YouTubeService = YouTubeService;
let _youtubeServiceInstance = null;
exports.youtubeService = {
    get instance() {
        if (!_youtubeServiceInstance) {
            _youtubeServiceInstance = new YouTubeService();
        }
        return _youtubeServiceInstance;
    },
};
//# sourceMappingURL=youtubeService.js.map