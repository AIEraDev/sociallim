import { PrismaClient } from "@prisma/client";
import { AnalysisServiceFactory } from "./analysisServiceFactory";
import { logger } from "../utils/logger";

export interface CacheConfig {
  enableCaching: boolean;
  cacheTTL: number; // Time to live in seconds
  maxCacheSize: number; // Maximum number of cached results
}

export interface AnalysisRequest {
  postId: string;
  userId: string;
  priority?: "low" | "normal" | "high";
  skipCache?: boolean;
  skipValidation?: boolean;
}

export interface AnalysisResponse {
  jobId?: string;
  cached?: boolean;
  estimatedTime?: number;
  validation: {
    valid: boolean;
    errors: string[];
  };
  cacheHit?: boolean;
}

/**
 * Integration service that coordinates analysis pipeline with Prisma Accelerate caching
 * Implements requirements 3.1, 3.2, 3.3, 3.4 for complete analysis workflow
 */
export class AnalysisIntegrationService {
  private prisma: PrismaClient;
  private analysisFactory: AnalysisServiceFactory;
  private cacheConfig: CacheConfig;
  private resultCache: Map<string, { result: any; timestamp: number }> = new Map();

  constructor(
    prisma: PrismaClient,
    cacheConfig: CacheConfig = {
      enableCaching: true,
      cacheTTL: 3600, // 1 hour
      maxCacheSize: 1000,
    }
  ) {
    this.prisma = prisma;
    this.cacheConfig = cacheConfig;
    this.analysisFactory = AnalysisServiceFactory.getInstance(prisma);
  }

  /**
   * Initialize the integration service
   */
  public async initialize(): Promise<void> {
    try {
      await this.analysisFactory.initialize();
      logger.info("Analysis integration service initialized");
    } catch (error) {
      logger.error("Failed to initialize analysis integration service:", error);
      throw error;
    }
  }

  /**
   * Request analysis with intelligent caching and queuing
   */
  public async requestAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const { postId, userId, priority = "normal", skipCache = false, skipValidation = false } = request;

      // Check cache first (unless skipped)
      if (!skipCache && this.cacheConfig.enableCaching) {
        const cachedResult = await this.getCachedResult(postId);
        if (cachedResult) {
          logger.info(`Cache hit for post ${postId}`);
          return {
            cached: true,
            cacheHit: true,
            validation: { valid: true, errors: [] },
          };
        }
      }

      // Use Prisma Accelerate for database-level caching
      const analysisResult = await this.checkDatabaseCache(postId);
      if (analysisResult && !skipCache) {
        // Store in memory cache for faster subsequent access
        this.setCachedResult(postId, analysisResult);

        logger.info(`Database cache hit for post ${postId}`);
        return {
          cached: true,
          cacheHit: true,
          validation: { valid: true, errors: [] },
        };
      }

      // Start new analysis
      const result = await this.analysisFactory.startAnalysis(postId, userId, {
        skipValidation,
        priority,
      });

      // If analysis was started successfully, set up cache invalidation
      if (result.jobId) {
        this.scheduleResultCaching(result.jobId, postId);
      }

      return {
        ...result,
        cacheHit: false,
      };
    } catch (error) {
      logger.error(`Failed to request analysis for post ${request.postId}:`, error);
      throw error;
    }
  }

  /**
   * Get analysis status with caching
   */
  public async getAnalysisStatus(jobId: string) {
    try {
      return await this.analysisFactory.getAnalysisStatus(jobId);
    } catch (error) {
      logger.error(`Failed to get analysis status for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get analysis results with caching
   */
  public async getAnalysisResults(jobId: string) {
    try {
      // Check if results are cached
      const cachedResults = this.getCachedResultByJobId(jobId);
      if (cachedResults) {
        return cachedResults;
      }

      // Fetch from database with Prisma Accelerate caching
      const results = await this.analysisFactory.getAnalysisResults(jobId);

      // Cache the results
      if (results) {
        this.setCachedResultByJobId(jobId, results);
      }

      return results;
    } catch (error) {
      logger.error(`Failed to get analysis results for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get user analysis history with pagination and caching
   */
  public async getUserAnalysisHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      includeResults?: boolean;
      fromCache?: boolean;
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, includeResults = false, fromCache = true } = options;

      // Check cache for user history
      const cacheKey = `user_history_${userId}_${limit}_${offset}`;
      if (fromCache && this.cacheConfig.enableCaching) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Fetch from database
      const history = await this.analysisFactory.getUserAnalysisHistory(userId, limit, offset);

      // Optionally include full results
      if (includeResults) {
        const historyWithResults = await Promise.all(
          history.map(async (job) => {
            if (job.hasResult) {
              try {
                const results = await this.getAnalysisResults(job.id);
                return { ...job, results };
              } catch (error) {
                logger.warn(`Failed to fetch results for job ${job.id}:`, error);
                return job;
              }
            }
            return job;
          })
        );

        // Cache the enriched history
        if (this.cacheConfig.enableCaching) {
          this.setCachedData(cacheKey, historyWithResults);
        }

        return historyWithResults;
      }

      // Cache the basic history
      if (this.cacheConfig.enableCaching) {
        this.setCachedData(cacheKey, history);
      }

      return history;
    } catch (error) {
      logger.error(`Failed to get user analysis history for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Compare multiple analysis results
   */
  public async compareAnalyses(jobIds: string[]) {
    try {
      const results = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            return await this.getAnalysisResults(jobId);
          } catch (error) {
            logger.warn(`Failed to fetch results for comparison job ${jobId}:`, error);
            return null;
          }
        })
      );

      const validResults = results.filter((result) => result !== null);

      if (validResults.length < 2) {
        throw new Error("At least 2 valid analysis results are required for comparison");
      }

      // Calculate comparison metrics
      const comparison = this.calculateComparisonMetrics(validResults);

      return {
        results: validResults,
        comparison,
        totalAnalyses: validResults.length,
        comparedAt: new Date(),
      };
    } catch (error) {
      logger.error("Failed to compare analyses:", error);
      throw error;
    }
  }

  /**
   * Get system health and performance metrics
   */
  public async getSystemHealth() {
    try {
      const [systemStats, cacheStats] = await Promise.all([this.analysisFactory.getSystemStats(), this.getCacheStats()]);

      return {
        system: systemStats,
        cache: cacheStats,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Failed to get system health:", error);
      throw error;
    }
  }

  /**
   * Perform system maintenance
   */
  public async performMaintenance() {
    try {
      const [factoryMaintenance, cacheMaintenance] = await Promise.all([this.analysisFactory.performMaintenance(), this.performCacheMaintenance()]);

      return {
        factory: factoryMaintenance,
        cache: cacheMaintenance,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Failed to perform maintenance:", error);
      throw error;
    }
  }

  /**
   * Check database cache using Prisma Accelerate
   */
  private async checkDatabaseCache(postId: string) {
    try {
      // Use Prisma's caching capabilities
      const result = await this.prisma.analysisResult.findFirst({
        where: { postId },
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
        orderBy: { analyzedAt: "desc" },
      });

      if (result) {
        // Check if result is still fresh (within cache TTL)
        const ageInSeconds = (Date.now() - result.analyzedAt.getTime()) / 1000;
        if (ageInSeconds < this.cacheConfig.cacheTTL) {
          return result;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error checking database cache for post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Get cached result from memory cache
   */
  private getCachedResult(postId: string) {
    if (!this.cacheConfig.enableCaching) return null;

    const cached = this.resultCache.get(`post_${postId}`);
    if (cached) {
      const ageInSeconds = (Date.now() - cached.timestamp) / 1000;
      if (ageInSeconds < this.cacheConfig.cacheTTL) {
        return cached.result;
      } else {
        // Remove expired cache entry
        this.resultCache.delete(`post_${postId}`);
      }
    }
    return null;
  }

  /**
   * Set cached result in memory cache
   */
  private setCachedResult(postId: string, result: any) {
    if (!this.cacheConfig.enableCaching) return;

    // Implement LRU eviction if cache is full
    if (this.resultCache.size >= this.cacheConfig.maxCacheSize) {
      const oldestKey = this.resultCache.keys().next().value;
      if (oldestKey) {
        this.resultCache.delete(oldestKey);
      }
    }

    this.resultCache.set(`post_${postId}`, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached result by job ID
   */
  private getCachedResultByJobId(jobId: string) {
    return this.getCachedData(`job_${jobId}`);
  }

  /**
   * Set cached result by job ID
   */
  private setCachedResultByJobId(jobId: string, result: any) {
    this.setCachedData(`job_${jobId}`, result);
  }

  /**
   * Generic cache getter
   */
  private getCachedData(key: string) {
    if (!this.cacheConfig.enableCaching) return null;

    const cached = this.resultCache.get(key);
    if (cached) {
      const ageInSeconds = (Date.now() - cached.timestamp) / 1000;
      if (ageInSeconds < this.cacheConfig.cacheTTL) {
        return cached.result;
      } else {
        this.resultCache.delete(key);
      }
    }
    return null;
  }

  /**
   * Generic cache setter
   */
  private setCachedData(key: string, data: any) {
    if (!this.cacheConfig.enableCaching) return;

    if (this.resultCache.size >= this.cacheConfig.maxCacheSize) {
      const oldestKey = this.resultCache.keys().next().value;
      if (oldestKey) {
        this.resultCache.delete(oldestKey);
      }
    }

    this.resultCache.set(key, {
      result: data,
      timestamp: Date.now(),
    });
  }

  /**
   * Schedule result caching after job completion
   */
  private scheduleResultCaching(jobId: string, postId: string) {
    // Poll for job completion and cache results
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.analysisFactory.getAnalysisStatus(jobId);

        if (status.status === "COMPLETED") {
          clearInterval(pollInterval);

          // Cache the completed results
          const results = await this.analysisFactory.getAnalysisResults(jobId);
          this.setCachedResult(postId, results);
          this.setCachedResultByJobId(jobId, results);

          logger.info(`Cached results for completed job ${jobId}`);
        } else if (status.status === "FAILED" || status.status === "CANCELLED") {
          clearInterval(pollInterval);
          logger.info(`Job ${jobId} ${status.status.toLowerCase()}, not caching results`);
        }
      } catch (error) {
        logger.error(`Error polling job ${jobId} for caching:`, error);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds

    // Clear interval after 10 minutes to prevent memory leaks
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10 * 60 * 1000);
  }

  /**
   * Calculate comparison metrics between analysis results
   */
  private calculateComparisonMetrics(results: any[]) {
    const sentimentComparison = results.map((result) => ({
      id: result.id,
      positive: result.sentimentBreakdown?.positive || 0,
      negative: result.sentimentBreakdown?.negative || 0,
      neutral: result.sentimentBreakdown?.neutral || 0,
    }));

    const avgSentiment = {
      positive: sentimentComparison.reduce((sum, s) => sum + s.positive, 0) / results.length,
      negative: sentimentComparison.reduce((sum, s) => sum + s.negative, 0) / results.length,
      neutral: sentimentComparison.reduce((sum, s) => sum + s.neutral, 0) / results.length,
    };

    const commentCounts = results.map((r) => r.totalComments);
    const avgComments = commentCounts.reduce((sum, count) => sum + count, 0) / results.length;

    return {
      sentimentComparison,
      avgSentiment,
      commentCounts,
      avgComments,
      trends: this.calculateTrends(results),
    };
  }

  /**
   * Calculate trends across analysis results
   */
  private calculateTrends(results: any[]) {
    // Sort by analysis date
    const sortedResults = results.sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime());

    if (sortedResults.length < 2) {
      return { sentiment: "stable", engagement: "stable" };
    }

    const first = sortedResults[0];
    const last = sortedResults[sortedResults.length - 1];

    // Calculate sentiment trend
    const firstPositive = first.sentimentBreakdown?.positive || 0;
    const lastPositive = last.sentimentBreakdown?.positive || 0;
    const sentimentChange = lastPositive - firstPositive;

    // Calculate engagement trend
    const firstComments = first.totalComments;
    const lastComments = last.totalComments;
    const engagementChange = (lastComments - firstComments) / firstComments;

    return {
      sentiment: sentimentChange > 0.1 ? "improving" : sentimentChange < -0.1 ? "declining" : "stable",
      engagement: engagementChange > 0.2 ? "increasing" : engagementChange < -0.2 ? "decreasing" : "stable",
      sentimentChange,
      engagementChange,
    };
  }

  /**
   * Get cache statistics
   */
  private getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, cached] of this.resultCache.entries()) {
      const ageInSeconds = (now - cached.timestamp) / 1000;
      if (ageInSeconds < this.cacheConfig.cacheTTL) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.resultCache.size,
      validEntries,
      expiredEntries,
      maxSize: this.cacheConfig.maxCacheSize,
      hitRate: validEntries / Math.max(1, this.resultCache.size),
      config: this.cacheConfig,
    };
  }

  /**
   * Perform cache maintenance
   */
  private async performCacheMaintenance() {
    const before = this.resultCache.size;
    const now = Date.now();
    let cleaned = 0;

    // Remove expired entries
    for (const [key, cached] of this.resultCache.entries()) {
      const ageInSeconds = (now - cached.timestamp) / 1000;
      if (ageInSeconds >= this.cacheConfig.cacheTTL) {
        this.resultCache.delete(key);
        cleaned++;
      }
    }

    const after = this.resultCache.size;

    return {
      entriesBefore: before,
      entriesAfter: after,
      entriesCleaned: cleaned,
      success: true,
    };
  }

  /**
   * Update cache configuration
   */
  public updateCacheConfig(config: Partial<CacheConfig>) {
    this.cacheConfig = { ...this.cacheConfig, ...config };

    // If caching is disabled, clear the cache
    if (!config.enableCaching) {
      this.resultCache.clear();
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache() {
    this.resultCache.clear();
    logger.info("Cache cleared");
  }

  /**
   * Graceful shutdown
   */
  public async shutdown() {
    try {
      await this.analysisFactory.shutdown();
      this.resultCache.clear();
      logger.info("Analysis integration service shutdown completed");
    } catch (error) {
      logger.error("Error during analysis integration service shutdown:", error);
      throw error;
    }
  }
}
