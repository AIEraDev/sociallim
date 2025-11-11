"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class JobManager {
    constructor(prisma, config) {
        this.jobQueue = new Map();
        this.processingJobs = new Set();
        this.maxConcurrentJobs = 3;
        this.processingInterval = null;
        this.prisma = prisma;
        this.startJobProcessor();
    }
    async createJob(postId, userId, totalComments) {
        try {
            const analysisJob = await this.prisma.analysisJob.create({
                data: {
                    postId,
                    userId,
                    status: client_1.JobStatus.PENDING,
                    totalSteps: 5,
                    currentStep: 0,
                    progress: 0,
                },
            });
            logger_1.logger.info(`Created analysis job ${analysisJob.id} for post ${postId}`);
            return analysisJob;
        }
        catch (error) {
            logger_1.logger.error("Failed to create analysis job:", error);
            throw new Error("Failed to create analysis job");
        }
    }
    async queueAnalysisJob(postId, userId, commentIds) {
        try {
            const analysisJob = await this.prisma.analysisJob.create({
                data: {
                    postId,
                    userId,
                    status: client_1.JobStatus.PENDING,
                    totalSteps: 5,
                    currentStep: 0,
                    progress: 0,
                },
            });
            const jobData = {
                jobId: analysisJob.id,
                postId,
                userId,
                commentIds,
            };
            const queuedJob = {
                id: analysisJob.id,
                data: jobData,
                attempts: 0,
                maxAttempts: 3,
                status: "waiting",
                createdAt: new Date(),
            };
            this.jobQueue.set(analysisJob.id, queuedJob);
            logger_1.logger.info(`Queued analysis job ${analysisJob.id} for post ${postId}`);
            return analysisJob.id;
        }
        catch (error) {
            logger_1.logger.error("Failed to queue analysis job:", error);
            throw new Error("Failed to queue analysis job");
        }
    }
    async updateJobProgress(jobId, progress) {
        try {
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    progress: progress.progress,
                    totalSteps: progress.totalSteps,
                    currentStep: progress.currentStep,
                    stepDescription: progress.stepDescription,
                    status: client_1.JobStatus.RUNNING,
                },
            });
            logger_1.logger.info(`Updated job ${jobId} progress: ${progress.progress}% - ${progress.stepDescription}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update job ${jobId} progress:`, error);
        }
    }
    async completeJob(jobId) {
        try {
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.JobStatus.COMPLETED,
                    progress: 100,
                    completedAt: new Date(),
                },
            });
            this.jobQueue.delete(jobId);
            this.processingJobs.delete(jobId);
            logger_1.logger.info(`Completed analysis job ${jobId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to complete job ${jobId}:`, error);
        }
    }
    async failJob(jobId, error) {
        try {
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.JobStatus.FAILED,
                    errorMessage: error,
                    completedAt: new Date(),
                },
            });
            this.jobQueue.delete(jobId);
            this.processingJobs.delete(jobId);
            logger_1.logger.error(`Failed analysis job ${jobId}: ${error}`);
        }
        catch (dbError) {
            logger_1.logger.error(`Failed to update job ${jobId} status:`, dbError);
        }
    }
    async getJobStatus(jobId) {
        try {
            const job = await this.prisma.analysisJob.findUnique({
                where: { id: jobId },
                include: {
                    post: {
                        select: {
                            title: true,
                            platform: true,
                        },
                    },
                },
            });
            if (!job) {
                throw new Error("Job not found");
            }
            return {
                id: job.id,
                status: job.status,
                progress: job.progress,
                totalSteps: job.totalSteps,
                currentStep: job.currentStep,
                stepDescription: job.stepDescription,
                errorMessage: job.errorMessage,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                post: job.post,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get job ${jobId} status:`, error);
            throw error;
        }
    }
    async getUserJobs(userId, limit = 10) {
        try {
            const jobs = await this.prisma.analysisJob.findMany({
                where: { userId },
                include: {
                    post: {
                        select: {
                            title: true,
                            platform: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });
            return jobs.map((job) => ({
                id: job.id,
                status: job.status,
                progress: job.progress,
                totalSteps: job.totalSteps,
                currentStep: job.currentStep,
                stepDescription: job.stepDescription,
                errorMessage: job.errorMessage,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                post: job.post,
            }));
        }
        catch (error) {
            logger_1.logger.error(`Failed to get jobs for user ${userId}:`, error);
            throw error;
        }
    }
    async cancelJob(jobId) {
        try {
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.JobStatus.CANCELLED,
                    completedAt: new Date(),
                },
            });
            this.jobQueue.delete(jobId);
            this.processingJobs.delete(jobId);
            logger_1.logger.info(`Cancelled analysis job ${jobId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to cancel job ${jobId}:`, error);
            throw error;
        }
    }
    registerProcessor(processor) {
        for (const [jobId, job] of this.jobQueue.entries()) {
            if (job.status === "waiting") {
                job.processor = processor;
            }
        }
    }
    startJobProcessor() {
        if (this.processingInterval) {
            return;
        }
        this.processingInterval = setInterval(async () => {
            await this.processNextJob();
        }, 1000);
    }
    async processNextJob() {
        if (this.processingJobs.size >= this.maxConcurrentJobs) {
            return;
        }
        const nextJob = Array.from(this.jobQueue.values()).find((job) => job.status === "waiting" && job.processor);
        if (!nextJob) {
            return;
        }
        nextJob.status = "active";
        nextJob.processedAt = new Date();
        this.processingJobs.add(nextJob.id);
        try {
            await this.prisma.analysisJob.update({
                where: { id: nextJob.id },
                data: {
                    status: client_1.JobStatus.RUNNING,
                    startedAt: new Date(),
                },
            });
            if (nextJob.processor) {
                await nextJob.processor(nextJob.data);
            }
            await this.completeJob(nextJob.id);
        }
        catch (error) {
            nextJob.attempts++;
            if (nextJob.attempts >= nextJob.maxAttempts) {
                await this.failJob(nextJob.id, error instanceof Error ? error.message : "Unknown error");
            }
            else {
                nextJob.status = "waiting";
                this.processingJobs.delete(nextJob.id);
                logger_1.logger.warn(`Job ${nextJob.id} failed, retrying (attempt ${nextJob.attempts}/${nextJob.maxAttempts})`);
            }
        }
    }
    async shutdown() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        const timeout = 30000;
        const startTime = Date.now();
        while (this.processingJobs.size > 0 && Date.now() - startTime < timeout) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        logger_1.logger.info("Job manager shutdown complete");
    }
    getQueueStats() {
        const waiting = Array.from(this.jobQueue.values()).filter((job) => job.status === "waiting").length;
        const active = this.processingJobs.size;
        const total = this.jobQueue.size;
        return {
            waiting,
            active,
            total,
            maxConcurrent: this.maxConcurrentJobs,
        };
    }
}
exports.JobManager = JobManager;
//# sourceMappingURL=jobManager.js.map