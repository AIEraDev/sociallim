"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenManager = exports.TokenManager = void 0;
const oauthService_1 = require("./oauthService");
const prisma_1 = __importDefault(require("../config/prisma"));
class TokenManager {
    async getValidToken(userId, platform) {
        try {
            const connection = await oauthService_1.oauthService.getConnection(userId, platform);
            if (!connection) {
                throw new Error(`No connection found for platform ${platform}`);
            }
            if (oauthService_1.oauthService.isTokenExpired(connection.tokenExpiresAt, 30)) {
                console.log(`Token for ${platform} is expired or will expire soon, refreshing...`);
                try {
                    await oauthService_1.oauthService.refreshToken(userId, platform);
                    const refreshedConnection = await oauthService_1.oauthService.getConnection(userId, platform);
                    return refreshedConnection?.accessToken || null;
                }
                catch (refreshError) {
                    console.error(`Failed to refresh token for ${platform}:`, refreshError);
                    await this.markConnectionAsInvalid(userId, platform);
                    throw new Error(`Token refresh failed for ${platform}. Please reconnect your account.`);
                }
            }
            return connection.accessToken;
        }
        catch (error) {
            console.error(`Error getting valid token for ${platform}:`, error);
            throw error;
        }
    }
    async validateAllTokens(userId) {
        const connections = await oauthService_1.oauthService.getUserConnections(userId);
        const results = [];
        for (const connection of connections) {
            try {
                const isValid = await oauthService_1.oauthService.validateToken(userId, connection.platform);
                results.push({
                    platform: connection.platform,
                    isValid,
                    needsReconnection: !isValid,
                });
            }
            catch (error) {
                results.push({
                    platform: connection.platform,
                    isValid: false,
                    needsReconnection: true,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        return results;
    }
    async refreshExpiringTokens(userId) {
        const connections = await oauthService_1.oauthService.getUserConnections(userId);
        const results = [];
        for (const connection of connections) {
            try {
                const fullConnection = await oauthService_1.oauthService.getConnection(userId, connection.platform);
                if (!fullConnection) {
                    continue;
                }
                if (oauthService_1.oauthService.isTokenExpired(fullConnection.tokenExpiresAt, 24 * 60)) {
                    const refreshResult = await oauthService_1.oauthService.refreshToken(userId, connection.platform);
                    results.push({
                        platform: connection.platform,
                        refreshed: refreshResult !== null,
                    });
                }
                else {
                    results.push({
                        platform: connection.platform,
                        refreshed: false,
                    });
                }
            }
            catch (error) {
                results.push({
                    platform: connection.platform,
                    refreshed: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        return results;
    }
    async markConnectionAsInvalid(userId, platform) {
        try {
            console.warn(`Connection marked as invalid: User ${userId}, Platform ${platform}`);
        }
        catch (error) {
            console.error("Error marking connection as invalid:", error);
        }
    }
    async batchValidateTokens(userIds) {
        const results = new Map();
        await prisma_1.default.$transaction(async (tx) => {
            for (const userId of userIds) {
                const userConnections = await tx.connectedPlatform.findMany({
                    where: { userId },
                    select: {
                        platform: true,
                        tokenExpiresAt: true,
                    },
                });
                const userResults = [];
                for (const connection of userConnections) {
                    const isValid = !oauthService_1.oauthService.isTokenExpired(connection.tokenExpiresAt);
                    userResults.push({
                        platform: connection.platform,
                        isValid,
                    });
                }
                results.set(userId, userResults);
            }
        });
        return results;
    }
    async cleanupExpiredTokens() {
        const errors = [];
        let deletedConnections = 0;
        try {
            const expiredConnections = await prisma_1.default.connectedPlatform.findMany({
                where: {
                    tokenExpiresAt: {
                        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    userId: true,
                    platform: true,
                    id: true,
                },
            });
            for (const connection of expiredConnections) {
                try {
                    const isValid = await oauthService_1.oauthService.validateToken(connection.userId, connection.platform);
                    if (!isValid) {
                        try {
                            await oauthService_1.oauthService.refreshToken(connection.userId, connection.platform);
                        }
                        catch (refreshError) {
                            await prisma_1.default.connectedPlatform.delete({
                                where: { id: connection.id },
                            });
                            deletedConnections++;
                            console.log(`Deleted expired connection: User ${connection.userId}, Platform ${connection.platform}`);
                        }
                    }
                }
                catch (error) {
                    errors.push(`Error processing connection ${connection.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }
        }
        catch (error) {
            errors.push(`Error during cleanup: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        return { deletedConnections, errors };
    }
}
exports.TokenManager = TokenManager;
exports.tokenManager = new TokenManager();
//# sourceMappingURL=tokenManager.js.map