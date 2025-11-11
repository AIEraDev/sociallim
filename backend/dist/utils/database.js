"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.DatabaseUtils = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.prisma = prisma_1.default;
const logger_1 = require("./logger");
class DatabaseUtils {
    static async checkConnection() {
        try {
            await prisma_1.default.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error("Database connection check failed:", error);
            return false;
        }
    }
    static async getStats() {
        try {
            const [userCount, platformCount, postCount, commentCount, analysisCount] = await Promise.all([prisma_1.default.user.count(), prisma_1.default.connectedPlatform.count(), prisma_1.default.post.count(), prisma_1.default.comment.count(), prisma_1.default.analysisResult.count()]);
            return {
                users: userCount,
                connectedPlatforms: platformCount,
                posts: postCount,
                comments: commentCount,
                analysisResults: analysisCount,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to get database stats:", error);
            throw error;
        }
    }
    static async cleanupOldAnalysis(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const result = await prisma_1.default.analysisResult.deleteMany({
                where: {
                    analyzedAt: {
                        lt: cutoffDate,
                    },
                },
            });
            logger_1.logger.info(`Cleaned up ${result.count} old analysis results`);
            return result.count;
        }
        catch (error) {
            logger_1.logger.error("Failed to cleanup old analysis results:", error);
            throw error;
        }
    }
    static async getUserWithPlatforms(userId) {
        return prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                connectedPlatforms: true,
            },
        });
    }
    static async getPostWithDetails(postId) {
        return prisma_1.default.post.findUnique({
            where: { id: postId },
            include: {
                comments: {
                    orderBy: { publishedAt: "desc" },
                },
                analysisResults: {
                    include: {
                        sentimentBreakdown: true,
                        emotions: true,
                        themes: true,
                        keywords: true,
                    },
                    orderBy: { analyzedAt: "desc" },
                },
                user: true,
            },
        });
    }
    static async getAnalysisWithDetails(analysisId) {
        return prisma_1.default.analysisResult.findUnique({
            where: { id: analysisId },
            include: {
                sentimentBreakdown: true,
                emotions: true,
                themes: true,
                keywords: true,
                post: {
                    include: {
                        comments: true,
                    },
                },
                user: true,
            },
        });
    }
    static async disconnect() {
        try {
            await prisma_1.default.$disconnect();
            logger_1.logger.info("Database connection closed");
        }
        catch (error) {
            logger_1.logger.error("Error disconnecting from database:", error);
        }
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=database.js.map