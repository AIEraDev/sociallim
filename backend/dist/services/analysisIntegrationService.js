"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisIntegrationService = void 0;
const analysisServiceFactory_1 = require("./analysisServiceFactory");
const logger_1 = require("../utils/logger");
class AnalysisIntegrationService {
    constructor(prisma, cacheConfig = {
        enableCaching: true,
        cacheTTL: 3600,
        maxCacheSize: 1000,
    }) {
        this.resultCache = new Map();
        this.prisma = prisma;
        this.cacheConfig = cacheConfig;
        this.analysisFactory = analysisServiceFactory_1.AnalysisServiceFactory.getInstance(prisma);
    }
    async initialize() {
        try {
            await this.analysisFactory.initialize();
            logger_1.logger.info("Analysis integration service initialized");
        }
        catch (error) {
            logger_1.logger.error("Failed to initialize analysis integration service:", error);
            throw error;
        }
    }
    async requestAnalysis(request) {
        try {
            const { postId, userId, priority = "normal", skipCache = false, skipValidation = false } = request;
            if (!skipCache && this.cacheConfig.enableCaching) {
                const cachedResult = await this.getCachedResult(postId);
                if (cachedResult) {
                    logger_1.logger.info(`Cache hit for post ${postId}`);
                    return {
                        cached: true,
                        cacheHit: true,
                        validation: { valid: true, errors: [] },
                    };
                }
            }
            const analysisResult = await this.checkDatabaseCache(postId);
            if (analysisResult && !skipCache) {
                this.setCachedResult(postId, analysisResult);
                logger_1.logger.info(`Database cache hit for post ${postId}`);
                return {
                    cached: true,
                    cacheHit: true,
                    validation: { valid: true, errors: [] },
                };
            }
            const result = await this.analysisFactory.startAnalysis(postId, userId, {
                skipValidation,
                priority,
            });
            if (result.jobId) {
                this.scheduleResultCaching(result.jobId, postId);
            }
            return {
                ...result,
                cacheHit: false,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to request analysis for post ${request.postId}:`, error);
            throw error;
        }
    }
    async getAnalysisStatus(jobId) {
        try {
            return await this.analysisFactory.getAnalysisStatus(jobId);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get analysis status for job ${jobId}:`, error);
            throw error;
        }
    }
    async getAnalysisResults(jobId) {
        try {
            const cachedResults = this.getCachedResultByJobId(jobId);
            if (cachedResults) {
                return cachedResults;
            }
            const results = await this.analysisFactory.getAnalysisResults(jobId);
            if (results) {
                this.setCachedResultByJobId(jobId, results);
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get analysis results for job ${jobId}:`, error);
            throw error;
        }
    }
    async getUserAnalysisHistory(userId, options = {}) {
        try {
            const { limit = 20, offset = 0, includeResults = false, fromCache = true } = options;
            const cacheKey = `user_history_${userId}_${limit}_${offset}`;
            if (fromCache && this.cacheConfig.enableCaching) {
                const cached = this.getCachedData(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            const history = await this.analysisFactory.getUserAnalysisHistory(userId, limit, offset);
            if (includeResults) {
                const historyWithResults = await Promise.all(history.map(async (job) => {
                    if (job.hasResult) {
                        try {
                            const results = await this.getAnalysisResults(job.id);
                            return { ...job, results };
                        }
                        catch (error) {
                            logger_1.logger.warn(`Failed to fetch results for job ${job.id}:`, error);
                            return job;
                        }
                    }
                    return job;
                }));
                if (this.cacheConfig.enableCaching) {
                    this.setCachedData(cacheKey, historyWithResults);
                }
                return historyWithResults;
            }
            if (this.cacheConfig.enableCaching) {
                this.setCachedData(cacheKey, history);
            }
            return history;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get user analysis history for ${userId}:`, error);
            throw error;
        }
    }
    async compareAnalyses(jobIds) {
        try {
            const results = await Promise.all(jobIds.map(async (jobId) => {
                try {
                    return await this.getAnalysisResults(jobId);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to fetch results for comparison job ${jobId}:`, error);
                    return null;
                }
            }));
            const validResults = results.filter((result) => result !== null);
            if (validResults.length < 2) {
                throw new Error("At least 2 valid analysis results are required for comparison");
            }
            const comparison = this.calculateComparisonMetrics(validResults);
            return {
                results: validResults,
                comparison,
                totalAnalyses: validResults.length,
                comparedAt: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to compare analyses:", error);
            throw error;
        }
    }
    async getSystemHealth() {
        try {
            const [systemStats, cacheStats] = await Promise.all([this.analysisFactory.getSystemStats(), this.getCacheStats()]);
            return {
                system: systemStats,
                cache: cacheStats,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to get system health:", error);
            throw error;
        }
    }
    async performMaintenance() {
        try {
            const [factoryMaintenance, cacheMaintenance] = await Promise.all([this.analysisFactory.performMaintenance(), this.performCacheMaintenance()]);
            return {
                factory: factoryMaintenance,
                cache: cacheMaintenance,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to perform maintenance:", error);
            throw error;
        }
    }
    async checkDatabaseCache(postId) {
        try {
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
                const ageInSeconds = (Date.now() - result.analyzedAt.getTime()) / 1000;
                if (ageInSeconds < this.cacheConfig.cacheTTL) {
                    return result;
                }
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error checking database cache for post ${postId}:`, error);
            return null;
        }
    }
    getCachedResult(postId) {
        if (!this.cacheConfig.enableCaching)
            return null;
        const cached = this.resultCache.get(`post_${postId}`);
        if (cached) {
            const ageInSeconds = (Date.now() - cached.timestamp) / 1000;
            if (ageInSeconds < this.cacheConfig.cacheTTL) {
                return cached.result;
            }
            else {
                this.resultCache.delete(`post_${postId}`);
            }
        }
        return null;
    }
    setCachedResult(postId, result) {
        if (!this.cacheConfig.enableCaching)
            return;
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
    getCachedResultByJobId(jobId) {
        return this.getCachedData(`job_${jobId}`);
    }
    setCachedResultByJobId(jobId, result) {
        this.setCachedData(`job_${jobId}`, result);
    }
    getCachedData(key) {
        if (!this.cacheConfig.enableCaching)
            return null;
        const cached = this.resultCache.get(key);
        if (cached) {
            const ageInSeconds = (Date.now() - cached.timestamp) / 1000;
            if (ageInSeconds < this.cacheConfig.cacheTTL) {
                return cached.result;
            }
            else {
                this.resultCache.delete(key);
            }
        }
        return null;
    }
    setCachedData(key, data) {
        if (!this.cacheConfig.enableCaching)
            return;
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
    scheduleResultCaching(jobId, postId) {
        const pollInterval = setInterval(async () => {
            try {
                const status = await this.analysisFactory.getAnalysisStatus(jobId);
                if (status.status === "COMPLETED") {
                    clearInterval(pollInterval);
                    const results = await this.analysisFactory.getAnalysisResults(jobId);
                    this.setCachedResult(postId, results);
                    this.setCachedResultByJobId(jobId, results);
                    logger_1.logger.info(`Cached results for completed job ${jobId}`);
                }
                else if (status.status === "FAILED" || status.status === "CANCELLED") {
                    clearInterval(pollInterval);
                    logger_1.logger.info(`Job ${jobId} ${status.status.toLowerCase()}, not caching results`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error polling job ${jobId} for caching:`, error);
                clearInterval(pollInterval);
            }
        }, 5000);
        setTimeout(() => {
            clearInterval(pollInterval);
        }, 10 * 60 * 1000);
    }
    calculateComparisonMetrics(results) {
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
    calculateTrends(results) {
        const sortedResults = results.sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime());
        if (sortedResults.length < 2) {
            return { sentiment: "stable", engagement: "stable" };
        }
        const first = sortedResults[0];
        const last = sortedResults[sortedResults.length - 1];
        const firstPositive = first.sentimentBreakdown?.positive || 0;
        const lastPositive = last.sentimentBreakdown?.positive || 0;
        const sentimentChange = lastPositive - firstPositive;
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
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        for (const [key, cached] of this.resultCache.entries()) {
            const ageInSeconds = (now - cached.timestamp) / 1000;
            if (ageInSeconds < this.cacheConfig.cacheTTL) {
                validEntries++;
            }
            else {
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
    async performCacheMaintenance() {
        const before = this.resultCache.size;
        const now = Date.now();
        let cleaned = 0;
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
    updateCacheConfig(config) {
        this.cacheConfig = { ...this.cacheConfig, ...config };
        if (!config.enableCaching) {
            this.resultCache.clear();
        }
    }
    clearCache() {
        this.resultCache.clear();
        logger_1.logger.info("Cache cleared");
    }
    async shutdown() {
        try {
            await this.analysisFactory.shutdown();
            this.resultCache.clear();
            logger_1.logger.info("Analysis integration service shutdown completed");
        }
        catch (error) {
            logger_1.logger.error("Error during analysis integration service shutdown:", error);
            throw error;
        }
    }
}
exports.AnalysisIntegrationService = AnalysisIntegrationService;
//# sourceMappingURL=analysisIntegrationService.js.map