"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = exports.OAuthService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const encryption_1 = require("../utils/encryption");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
class OAuthService {
    async storeConnection(userId, tokenData) {
        try {
            await prisma_1.default.connectedPlatform.upsert({
                where: {
                    userId_platform: {
                        userId,
                        platform: tokenData.platform,
                    },
                },
                update: {
                    platformUserId: tokenData.platformUserId,
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken,
                    tokenExpiresAt: tokenData.tokenExpiresAt,
                },
                create: {
                    userId,
                    platform: tokenData.platform,
                    platformUserId: tokenData.platformUserId,
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken,
                    tokenExpiresAt: tokenData.tokenExpiresAt,
                },
            });
        }
        catch (error) {
            console.error("Error storing OAuth connection:", error);
            throw new Error("Failed to store OAuth connection");
        }
    }
    async getConnection(userId, platform) {
        try {
            const connection = await prisma_1.default.connectedPlatform.findUnique({
                where: {
                    userId_platform: {
                        userId,
                        platform,
                    },
                },
            });
            if (!connection) {
                return null;
            }
            return {
                ...connection,
                accessToken: (0, encryption_1.decrypt)(connection.accessToken),
                refreshToken: connection.refreshToken ? (0, encryption_1.decrypt)(connection.refreshToken) : null,
            };
        }
        catch (error) {
            console.error("Error getting OAuth connection:", error);
            throw new Error("Failed to get OAuth connection");
        }
    }
    async getUserConnections(userId) {
        try {
            const connections = await prisma_1.default.connectedPlatform.findMany({
                where: { userId },
                select: {
                    platform: true,
                    platformUserId: true,
                    connectedAt: true,
                    tokenExpiresAt: true,
                },
            });
            return connections;
        }
        catch (error) {
            console.error("Error getting user connections:", error);
            throw new Error("Failed to get user connections");
        }
    }
    isTokenExpired(tokenExpiresAt, bufferMinutes = 30) {
        if (!tokenExpiresAt) {
            return false;
        }
        const now = new Date();
        const expirationWithBuffer = new Date(tokenExpiresAt.getTime() - bufferMinutes * 60 * 1000);
        return now >= expirationWithBuffer;
    }
    async refreshToken(userId, platform) {
        const connection = await this.getConnection(userId, platform);
        if (!connection || !connection.refreshToken) {
            throw new Error("No refresh token available for this platform");
        }
        try {
            let refreshResult = null;
            switch (platform) {
                case client_1.Platform.YOUTUBE:
                    refreshResult = await this.refreshGoogleToken(connection.refreshToken);
                    break;
                case client_1.Platform.INSTAGRAM:
                    refreshResult = await this.refreshInstagramToken(connection.refreshToken);
                    break;
                case client_1.Platform.TWITTER:
                    return null;
                case client_1.Platform.TIKTOK:
                    refreshResult = await this.refreshTikTokToken(connection.refreshToken);
                    break;
                default:
                    throw new Error(`Token refresh not implemented for platform: ${platform}`);
            }
            if (refreshResult) {
                await prisma_1.default.connectedPlatform.update({
                    where: {
                        userId_platform: {
                            userId,
                            platform,
                        },
                    },
                    data: {
                        accessToken: (0, encryption_1.encrypt)(refreshResult.accessToken),
                        refreshToken: refreshResult.refreshToken ? (0, encryption_1.encrypt)(refreshResult.refreshToken) : undefined,
                        tokenExpiresAt: refreshResult.expiresAt,
                    },
                });
            }
            return refreshResult;
        }
        catch (error) {
            console.error(`Error refreshing ${platform} token:`, error);
            throw new Error(`Failed to refresh ${platform} token`);
        }
    }
    async refreshGoogleToken(refreshToken) {
        const response = await axios_1.default.post("https://oauth2.googleapis.com/token", {
            client_id: process.env.YOUTUBE_CLIENT_ID,
            client_secret: process.env.YOUTUBE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });
        const { access_token, refresh_token, expires_in } = response.data;
        return {
            accessToken: access_token,
            refreshToken: refresh_token || refreshToken,
            expiresAt: new Date(Date.now() + expires_in * 1000),
        };
    }
    async refreshInstagramToken(refreshToken) {
        const response = await axios_1.default.post("https://api.instagram.com/oauth/access_token", {
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });
        const { access_token, expires_in } = response.data;
        return {
            accessToken: access_token,
            refreshToken: refreshToken,
            expiresAt: new Date(Date.now() + expires_in * 1000),
        };
    }
    async refreshTikTokToken(refreshToken) {
        const response = await axios_1.default.post("https://open-api.tiktok.com/oauth/refresh_token/", {
            client_key: process.env.TIKTOK_CLIENT_ID,
            client_secret: process.env.TIKTOK_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });
        const { access_token, refresh_token, expires_in } = response.data;
        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
        };
    }
    async validateToken(userId, platform) {
        const connection = await this.getConnection(userId, platform);
        if (!connection) {
            return false;
        }
        if (this.isTokenExpired(connection.tokenExpiresAt)) {
            return false;
        }
        try {
            switch (platform) {
                case client_1.Platform.YOUTUBE:
                    return await this.validateYouTubeToken(connection.accessToken);
                case client_1.Platform.INSTAGRAM:
                    return await this.validateInstagramToken(connection.accessToken);
                case client_1.Platform.TWITTER:
                    return await this.validateTwitterToken(connection.accessToken);
                case client_1.Platform.TIKTOK:
                    return await this.validateTikTokToken(connection.accessToken);
                default:
                    return false;
            }
        }
        catch (error) {
            console.error(`Error validating ${platform} token:`, error);
            return false;
        }
    }
    async validateYouTubeToken(accessToken) {
        try {
            const response = await axios_1.default.get("https://www.googleapis.com/youtube/v3/channels", {
                params: {
                    part: "id",
                    mine: true,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async validateInstagramToken(accessToken) {
        try {
            const response = await axios_1.default.get("https://graph.instagram.com/me", {
                params: {
                    fields: "id",
                    access_token: accessToken,
                },
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async validateTwitterToken(accessToken) {
        try {
            const response = await axios_1.default.get("https://api.twitter.com/2/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async validateTikTokToken(accessToken) {
        try {
            const response = await axios_1.default.post("https://open-api.tiktok.com/oauth/userinfo/", {
                access_token: accessToken,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async disconnectPlatform(userId, platform) {
        try {
            await prisma_1.default.connectedPlatform.delete({
                where: {
                    userId_platform: {
                        userId,
                        platform,
                    },
                },
            });
        }
        catch (error) {
            console.error("Error disconnecting platform:", error);
            throw new Error("Failed to disconnect platform");
        }
    }
}
exports.OAuthService = OAuthService;
exports.oauthService = new OAuthService();
//# sourceMappingURL=oauthService.js.map