import { PrismaClient } from "@prisma/client";
import { JobManager } from "./jobManager";
import { AnalysisOrchestrationService } from "./analysisOrchestrationService";
import { logger } from "../utils/logger";

export interface AnalysisServiceConfig {
  jobConfig?: {
    maxConcurrentJobs?: number;
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
  };
}

/**
 * Factory service for creating and managing analysis services
 * Provides a centralized way to initialize and coordinate all analysis components
 */
export class AnalysisServiceFactory {
  private static instance: AnalysisServiceFactory;
  private jobManager: JobManager | null = null;
  private orchestrationService: AnalysisOrchestrationService | null = null;
  private prisma: PrismaClient;
  private config: AnalysisServiceConfig;

  private constructor(prisma: PrismaClient, config: AnalysisServiceConfig = {}) {
    this.prisma = prisma;
    this.config = config;
  }

  /**
   * Get singleton instance of the analysis service factory
   */
  public static getInstance(prisma?: PrismaClient, config?: AnalysisServiceConfig): AnalysisServiceFactory {
    if (!AnalysisServiceFactory.instance) {
      if (!prisma) {
        throw new Error("Prisma client is required for first initialization");
      }
      AnalysisServiceFactory.instance = new AnalysisServiceFactory(prisma, config);
    }
    return AnalysisServiceFactory.instance;
  }

  /**
   * Initialize all analysis services
   */
  public async initialize(): Promise<void> {
    try {
      logger.info("Initializing analysis services...");

      // Initialize job manager
      this.jobManager = new JobManager(this.prisma, this.config.jobConfig);

      // Initialize orchestration service
      this.orchestrationService = new AnalysisOrchestrationService(this.prisma, this.jobManager);

      // Configure job processing settings if provided
      if (this.config.jobConfig) {
        this.jobManager.updateProcessingConfig(this.config.jobConfig);
      }

      logger.info("Analysis services initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize analysis services:", error);
      throw error;
    }
  }

  /**
   * Get the job manager instance
   */
  public getJobManager(): JobManager {
    if (!this.jobManager) {
      throw new Error("Analysis services not initialized. Call initialize() first.");
    }
    return this.jobManager;
  }

  /**
   * Get the orchestration service instance
   */
  public getOrchestrationService(): AnalysisOrchestrationService {
    if (!this.orchestrationService) {
      throw new Error("Analysis services not initialized. Call initialize() first.");
    }
    return this.orchestrationService;
  }

  /**
   * Start a new analysis job with validation and caching
   */
  public async startAnalysis(
    postId: string,
    userId: string,
    options: {
      skipValidation?: boolean;
      priority?: "low" | "normal" | "high";
      estimateOnly?: boolean;
    } = {}
  ): Promise<{
    jobId?: string;
    estimatedTime?: number;
    validation: {
      valid: boolean;
      errors: string[];
    };
    cached?: boolean;
  }> {
    const orchestrationService = this.getOrchestrationService();
    const jobManager = this.getJobManager();

    try {
      // Validate prerequisites unless skipped
      let validation: { valid: boolean; errors: string[] } = { valid: true, errors: [] };
      if (!options.skipValidation) {
        validation = await orchestrationService.validateAnalysisPrerequisites(postId, userId);
        if (!validation.valid) {
          return { validation };
        }
      }

      // Check for existing analysis (caching)
      const existingResult = await this.checkForExistingAnalysis(postId);
      if (existingResult) {
        return {
          validation,
          cached: true,
        };
      }

      // Get comments for the post
      const comments = await this.prisma.comment.findMany({
        where: {
          post: { id: postId, userId },
          isFiltered: false,
        },
      });

      // Estimate analysis time
      const estimatedTime = orchestrationService.estimateAnalysisTime(comments.length);

      if (options.estimateOnly) {
        return {
          validation,
          estimatedTime,
        };
      }

      // Queue the analysis job
      const commentIds = comments.map((c) => c.id);
      const jobOptions = this.getJobOptions(options.priority);
      const jobId = await jobManager.queueAnalysisJob(postId, userId, commentIds, jobOptions);

      return {
        jobId,
        estimatedTime,
        validation,
      };
    } catch (error) {
      logger.error(`Failed to start analysis for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Get analysis status and progress
   */
  public async getAnalysisStatus(jobId: string) {
    const jobManager = this.getJobManager();
    return await jobManager.getJobStatus(jobId);
  }

  /**
   * Get analysis results
   */
  public async getAnalysisResults(jobId: string) {
    try {
      const analysisResult = await this.prisma.analysisResult.findFirst({
        where: { jobId },
        include: {
          sentimentBreakdown: true,
          emotions: true,
          themes: true,
          keywords: true,
          post: {
            select: {
              title: true,
              platform: true,
              publishedAt: true,
            },
          },
        },
      });

      if (!analysisResult) {
        throw new Error("Analysis results not found");
      }

      return {
        id: analysisResult.id,
        summary: analysisResult.summary,
        totalComments: analysisResult.totalComments,
        filteredComments: analysisResult.filteredComments,
        analyzedAt: analysisResult.analyzedAt,
        post: analysisResult.post,
        sentimentBreakdown: analysisResult.sentimentBreakdown,
        emotions: analysisResult.emotions,
        themes: analysisResult.themes,
        keywords: analysisResult.keywords,
      };
    } catch (error) {
      logger.error(`Failed to get analysis results for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a running analysis job
   */
  public async cancelAnalysis(jobId: string): Promise<void> {
    const jobManager = this.getJobManager();
    await jobManager.cancelJob(jobId);
  }

  /**
   * Retry a failed analysis job
   */
  public async retryAnalysis(jobId: string): Promise<void> {
    const jobManager = this.getJobManager();
    await jobManager.retryJob(jobId);
  }

  /**
   * Get user's analysis history
   */
  public async getUserAnalysisHistory(userId: string, limit = 20, offset = 0) {
    const jobManager = this.getJobManager();
    return await jobManager.getUserJobs(userId, limit, offset);
  }

  /**
   * Get system statistics and health
   */
  public async getSystemStats() {
    const jobManager = this.getJobManager();
    const orchestrationService = this.getOrchestrationService();

    const [queueStats, pipelineStatus] = await Promise.all([jobManager.getQueueStats(), orchestrationService.getAnalysisPipelineStatus()]);

    // Get database statistics
    const dbStats = await this.getDatabaseStats();

    return {
      queue: queueStats,
      pipeline: pipelineStatus,
      database: dbStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  /**
   * Perform system maintenance tasks
   */
  public async performMaintenance(): Promise<{
    jobsCleanedUp: boolean;
    cacheCleared: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let jobsCleanedUp = false;
    let cacheCleared = false;

    try {
      // Clean up old jobs
      const jobManager = this.getJobManager();
      await jobManager.cleanupJobs();
      jobsCleanedUp = true;
      logger.info("Job cleanup completed");
    } catch (error) {
      errors.push(`Job cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
      // Clear old cached results (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await this.prisma.analysisResult.deleteMany({
        where: {
          analyzedAt: { lt: sevenDaysAgo },
          job: { status: "COMPLETED" },
        },
      });
      cacheCleared = true;
      logger.info("Cache cleanup completed");
    } catch (error) {
      errors.push(`Cache cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    return {
      jobsCleanedUp,
      cacheCleared,
      errors,
    };
  }

  /**
   * Gracefully shutdown all services
   */
  public async shutdown(): Promise<void> {
    try {
      logger.info("Shutting down analysis services...");

      if (this.jobManager) {
        await this.jobManager.shutdown();
      }

      logger.info("Analysis services shutdown completed");
    } catch (error) {
      logger.error("Error during analysis services shutdown:", error);
      throw error;
    }
  }

  /**
   * Check for existing analysis results (caching)
   */
  private async checkForExistingAnalysis(postId: string) {
    try {
      const existingResult = await this.prisma.analysisResult.findFirst({
        where: { postId },
        orderBy: { analyzedAt: "desc" },
      });

      if (existingResult) {
        // Check if the result is recent (within last 24 hours)
        const hoursSinceAnalysis = (Date.now() - existingResult.analyzedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAnalysis < 24) {
          return existingResult;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error checking existing analysis for post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Get job options based on priority
   */
  private getJobOptions(priority: "low" | "normal" | "high" = "normal") {
    const priorityMap = {
      low: { priority: 1, delay: 5000 },
      normal: { priority: 5, delay: 0 },
      high: { priority: 10, delay: 0 },
    };

    return priorityMap[priority];
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats() {
    try {
      const [totalUsers, totalPosts, totalComments, totalAnalyses, recentAnalyses] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.comment.count(),
        this.prisma.analysisResult.count(),
        this.prisma.analysisResult.count({
          where: {
            analyzedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      return {
        totalUsers,
        totalPosts,
        totalComments,
        totalAnalyses,
        recentAnalyses,
      };
    } catch (error) {
      logger.error("Error getting database statistics:", error);
      return {
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalAnalyses: 0,
        recentAnalyses: 0,
      };
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AnalysisServiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Update job manager configuration if it exists
    if (this.jobManager && config.jobConfig) {
      this.jobManager.updateProcessingConfig(config.jobConfig);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): AnalysisServiceConfig {
    return { ...this.config };
  }
}
