import prisma from "../config/prisma";
import { logger } from "./logger";

/**
 * Database utility functions for common operations
 */
export class DatabaseUtils {
  /**
   * Check if the database connection is healthy
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error("Database connection check failed:", error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    try {
      const [userCount, platformCount, postCount, commentCount, analysisCount] = await Promise.all([prisma.user.count(), prisma.connectedPlatform.count(), prisma.post.count(), prisma.comment.count(), prisma.analysisResult.count()]);

      return {
        users: userCount,
        connectedPlatforms: platformCount,
        posts: postCount,
        comments: commentCount,
        analysisResults: analysisCount,
      };
    } catch (error) {
      logger.error("Failed to get database stats:", error);
      throw error;
    }
  }

  /**
   * Clean up old analysis results (older than specified days)
   */
  static async cleanupOldAnalysis(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.analysisResult.deleteMany({
        where: {
          analyzedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old analysis results`);
      return result.count;
    } catch (error) {
      logger.error("Failed to cleanup old analysis results:", error);
      throw error;
    }
  }

  /**
   * Get user with their connected platforms
   */
  static async getUserWithPlatforms(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        connectedPlatforms: true,
      },
    });
  }

  /**
   * Get post with comments and analysis results
   */
  static async getPostWithDetails(postId: string) {
    return prisma.post.findUnique({
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

  /**
   * Get analysis result with all related data
   */
  static async getAnalysisWithDetails(analysisId: string) {
    return prisma.analysisResult.findUnique({
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

  /**
   * Gracefully disconnect from database
   */
  static async disconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed");
    } catch (error) {
      logger.error("Error disconnecting from database:", error);
    }
  }
}

// Export prisma instance for direct use
export { prisma };
