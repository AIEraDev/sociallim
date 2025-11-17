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
        this.authUrl = "https://twitter.com/i/oauth2/authorize";
        this.tokenUrl = "https://api.twitter.com/2/oauth2/token";
        this.rateLimitInfo = {
            remaining: 300,
            resetTime: new Date(Date.now() + 15 * 60 * 1000),
            limit: 300,
        };
        this.clientId = process.env.TWITTER_CLIENT_ID;
        this.clientSecret = process.env.TWITTER_CLIENT_SECRET;
        this.callbackUrl = process.env.TWITTER_CALLBACK_URL || `${process.env.BACKEND_URL}/api/oauth/callback/twitter`;
        if (!this.clientId || !this.clientSecret) {
            throw new Error("Twitter OAuth 2.0 credentials are required: TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET");
        }
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
    generateAuthUrl(codeChallenge, state) {
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: this.callbackUrl,
            scope: "tweet.read users.read follows.read offline.access",
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        });
        return `${this.authUrl}?${params.toString()}`;
    }
    async exchangeCodeForToken(code, codeVerifier) {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this.callbackUrl,
            code_verifier: codeVerifier,
            client_id: this.clientId,
        });
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
        const response = await axios_1.default.post(this.tokenUrl, params.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`,
            },
        });
        return response.data;
    }
    async fetchUserInfo(accessToken) {
        try {
            console.log("Making Twitter API request with OAuth 2.0 User Context");
            const response = await this.apiClient.get("/users/me", {
                params: {
                    "user.fields": "id,name,username,description,public_metrics,profile_image_url,verified",
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const user = response.data.data;
            return {
                id: user.id,
                name: user.name,
                username: user.username,
                description: user.description,
                profileImageUrl: user.profile_image_url,
                verified: user.verified,
                followersCount: user.public_metrics?.followers_count,
                followingCount: user.public_metrics?.following_count,
                tweetCount: user.public_metrics?.tweet_count,
                listedCount: user.public_metrics?.listed_count,
            };
        }
        catch (error) {
            logger_1.logger.error("Error fetching Twitter user info:", error);
            throw this.transformError(error);
        }
    }
    async validateToken(accessToken) {
        try {
            console.log("TwitterService: Validating OAuth 2.0 User Access Token...");
            const response = await this.apiClient.get("/users/me", {
                params: {
                    "user.fields": "id",
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            console.log("Twitter API response:", {
                status: response.status,
                hasData: !!response.data,
                hasUserId: !!response.data?.data?.id,
            });
            return response.status === 200 && !!response.data.data?.id;
        }
        catch (error) {
            console.error("Twitter token validation failed:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            logger_1.logger.warn("Twitter token validation failed:", error);
            return false;
        }
    }
    async refreshAccessToken(refreshToken) {
        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: this.clientId,
        });
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
        const response = await axios_1.default.post(this.tokenUrl, params.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`,
            },
        });
        return response.data;
    }
    async fetchUserPosts(accessToken, options = {}) {
        return { posts: [] };
    }
    async fetchPostComments(accessToken, postId, options = {}) {
        return { comments: [] };
    }
    async getRateLimitInfo(accessToken) {
        return { ...this.rateLimitInfo };
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