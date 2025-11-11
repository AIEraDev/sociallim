"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisServiceFactory = void 0;
const jobManager_1 = require("./jobManager");
const analysisOrchestrationService_1 = require("./analysisOrchestrationService");
const logger_1 = require("../utils/logger");
class AnalysisServiceFactory {
    constructor(prisma, config = {}) {
        this.jobManager = null;
        this.orchestrationService = null;
        this.prisma = prisma;
        this.config = config;
    }
    static getInstance(prisma, config) {
        if (!AnalysisServiceFactory.instance) {
            if (!prisma) {
                throw new Error("Prisma client is required for first initialization");
            }
            AnalysisServiceFactory.instance = new AnalysisServiceFactory(prisma, config);
        }
        return AnalysisServiceFactory.instance;
    }
    async initialize() {
        try {
            logger_1.logger.info("Initializing analysis services...");
            this.jobManager = new jobManager_1.JobManager(this.prisma, this.config.jobConfig);
            this.orchestrationService = new analysisOrchestrationService_1.AnalysisOrchestrationService(this.prisma, this.jobManager);
            if (this.config.jobConfig) {
                this.jobManager.updateProcessingConfig(this.config.jobConfig);
            }
            logger_1.logger.info("Analysis services initialized successfully");
        }
        catch (error) {
            logger_1.logger.error("Failed to initialize analysis services:", error);
            throw error;
        }
    }
    getJobManager() {
        if (!this.jobManager) {
            throw new Error("Analysis services not initialized. Call initialize() first.");
        }
        return this.jobManager;
    }
    getOrchestrationService() {
        if (!this.orchestrationService) {
            throw new Error("Analysis services not initialized. Call initialize() first.");
        }
        return this.orchestrationService;
    }
    async startAnalysis(postId, userId, options = {}) {
        const orchestrationService = this.getOrchestrationService();
        const jobManager = this.getJobManager();
        try {
            let validation = { valid: true, errors: [] };
            if (!options.skipValidation) {
                validation = await orchestrationService.validateAnalysisPrerequisites(postId, userId);
                if (!validation.valid) {
                    return { validation };
                }
            }
            const existingResult = await this.checkForExistingAnalysis(postId);
            if (existingResult) {
                return {
                    validation,
                    cached: true,
                };
            }
            const comments = await this.prisma.comment.findMany({
                where: {
                    post: { id: postId, userId },
                    isFiltered: false,
                },
            });
            const estimatedTime = orchestrationService.estimateAnalysisTime(comments.length);
            if (options.estimateOnly) {
                return {
                    validation,
                    estimatedTime,
                };
            }
            const commentIds = comments.map((c) => c.id);
            const jobOptions = this.getJobOptions(options.priority);
            const jobId = await jobManager.queueAnalysisJob(postId, userId, commentIds, jobOptions);
            return {
                jobId,
                estimatedTime,
                validation,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to start analysis for post ${postId}:`, error);
            throw error;
        }
    }
    async getAnalysisStatus(jobId) {
        const jobManager = this.getJobManager();
        return await jobManager.getJobStatus(jobId);
    }
    async getAnalysisResults(jobId) {
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
        }
        catch (error) {
            logger_1.logger.error(`Failed to get analysis results for job ${jobId}:`, error);
            throw error;
        }
    }
    async cancelAnalysis(jobId) {
        const jobManager = this.getJobManager();
        await jobManager.cancelJob(jobId);
    }
    async retryAnalysis(jobId) {
        const jobManager = this.getJobManager();
        await jobManager.retryJob(jobId);
    }
    async getUserAnalysisHistory(userId, limit = 20, offset = 0) {
        const jobManager = this.getJobManager();
        return await jobManager.getUserJobs(userId, limit, offset);
    }
    async getSystemStats() {
        const jobManager = this.getJobManager();
        const orchestrationService = this.getOrchestrationService();
        const [queueStats, pipelineStatus] = await Promise.all([jobManager.getQueueStats(), orchestrationService.getAnalysisPipelineStatus()]);
        const dbStats = await this.getDatabaseStats();
        return {
            queue: queueStats,
            pipeline: pipelineStatus,
            database: dbStats,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
    async performMaintenance() {
        const errors = [];
        let jobsCleanedUp = false;
        let cacheCleared = false;
        try {
            const jobManager = this.getJobManager();
            await jobManager.cleanupJobs();
            jobsCleanedUp = true;
            logger_1.logger.info("Job cleanup completed");
        }
        catch (error) {
            errors.push(`Job cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            await this.prisma.analysisResult.deleteMany({
                where: {
                    analyzedAt: { lt: sevenDaysAgo },
                    job: { status: "COMPLETED" },
                },
            });
            cacheCleared = true;
            logger_1.logger.info("Cache cleanup completed");
        }
        catch (error) {
            errors.push(`Cache cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        return {
            jobsCleanedUp,
            cacheCleared,
            errors,
        };
    }
    async shutdown() {
        try {
            logger_1.logger.info("Shutting down analysis services...");
            if (this.jobManager) {
                await this.jobManager.shutdown();
            }
            logger_1.logger.info("Analysis services shutdown completed");
        }
        catch (error) {
            logger_1.logger.error("Error during analysis services shutdown:", error);
            throw error;
        }
    }
    async checkForExistingAnalysis(postId) {
        try {
            const existingResult = await this.prisma.analysisResult.findFirst({
                where: { postId },
                orderBy: { analyzedAt: "desc" },
            });
            if (existingResult) {
                const hoursSinceAnalysis = (Date.now() - existingResult.analyzedAt.getTime()) / (1000 * 60 * 60);
                if (hoursSinceAnalysis < 24) {
                    return existingResult;
                }
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error checking existing analysis for post ${postId}:`, error);
            return null;
        }
    }
    getJobOptions(priority = "normal") {
        const priorityMap = {
            low: { priority: 1, delay: 5000 },
            normal: { priority: 5, delay: 0 },
            high: { priority: 10, delay: 0 },
        };
        return priorityMap[priority];
    }
    async getDatabaseStats() {
        try {
            const [totalUsers, totalPosts, totalComments, totalAnalyses, recentAnalyses] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.post.count(),
                this.prisma.comment.count(),
                this.prisma.analysisResult.count(),
                this.prisma.analysisResult.count({
                    where: {
                        analyzedAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
        }
        catch (error) {
            logger_1.logger.error("Error getting database statistics:", error);
            return {
                totalUsers: 0,
                totalPosts: 0,
                totalComments: 0,
                totalAnalyses: 0,
                recentAnalyses: 0,
            };
        }
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (this.jobManager && config.jobConfig) {
            this.jobManager.updateProcessingConfig(config.jobConfig);
        }
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.AnalysisServiceFactory = AnalysisServiceFactory;
//# sourceMappingURL=analysisServiceFactory.js.map