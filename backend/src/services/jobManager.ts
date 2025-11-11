import { PrismaClient, JobStatus } from "@prisma/client";
import { logger } from "../utils/logger";

export interface AnalysisJobData {
  jobId: string;
  postId: string;
  userId: string;
  commentIds: string[];
}

export interface JobProgress {
  progress: number;
  totalSteps: number;
  currentStep: number;
  stepDescription: string;
}

// Simple in-memory job queue (for development without Redis)
interface QueuedJob {
  id: string;
  data: AnalysisJobData;
  attempts: number;
  maxAttempts: number;
  status: "waiting" | "active" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
  processor?: (data: AnalysisJobData) => Promise<void>;
}

export class JobManager {
  private jobQueue: Map<string, QueuedJob> = new Map();
  private processingJobs: Set<string> = new Set();
  private prisma: PrismaClient;
  private maxConcurrentJobs = 3;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient, config?: any) {
    this.prisma = prisma;

    // Start processing jobs
    this.startJobProcessor();
  }

  /**
   * Create a new analysis job record in database
   */
  async createJob(postId: string, userId: string, totalComments: number) {
    try {
      const analysisJob = await this.prisma.analysisJob.create({
        data: {
          postId,
          userId,
          status: JobStatus.PENDING,
          totalSteps: 5, // preprocessing, sentiment, themes, summary, save
          currentStep: 0,
          progress: 0,
        },
      });

      logger.info(`Created analysis job ${analysisJob.id} for post ${postId}`);
      return analysisJob;
    } catch (error) {
      logger.error("Failed to create analysis job:", error);
      throw new Error("Failed to create analysis job");
    }
  }

  /**
   * Queue a new analysis job
   */
  async queueAnalysisJob(postId: string, userId: string, commentIds: string[]): Promise<string> {
    try {
      // Create job record in database
      const analysisJob = await this.prisma.analysisJob.create({
        data: {
          postId,
          userId,
          status: JobStatus.PENDING,
          totalSteps: 5, // preprocessing, sentiment, themes, summary, save
          currentStep: 0,
          progress: 0,
        },
      });

      // Add job to in-memory queue
      const jobData: AnalysisJobData = {
        jobId: analysisJob.id,
        postId,
        userId,
        commentIds,
      };

      const queuedJob: QueuedJob = {
        id: analysisJob.id,
        data: jobData,
        attempts: 0,
        maxAttempts: 3,
        status: "waiting",
        createdAt: new Date(),
      };

      this.jobQueue.set(analysisJob.id, queuedJob);

      logger.info(`Queued analysis job ${analysisJob.id} for post ${postId}`);
      return analysisJob.id;
    } catch (error) {
      logger.error("Failed to queue analysis job:", error);
      throw new Error("Failed to queue analysis job");
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: JobProgress): Promise<void> {
    try {
      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          progress: progress.progress,
          totalSteps: progress.totalSteps,
          currentStep: progress.currentStep,
          stepDescription: progress.stepDescription,
          status: JobStatus.RUNNING,
        },
      });

      logger.info(`Updated job ${jobId} progress: ${progress.progress}% - ${progress.stepDescription}`);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} progress:`, error);
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string): Promise<void> {
    try {
      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // Remove from queue
      this.jobQueue.delete(jobId);
      this.processingJobs.delete(jobId);

      logger.info(`Completed analysis job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to complete job ${jobId}:`, error);
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    try {
      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          errorMessage: error,
          completedAt: new Date(),
        },
      });

      // Remove from queue
      this.jobQueue.delete(jobId);
      this.processingJobs.delete(jobId);

      logger.error(`Failed analysis job ${jobId}: ${error}`);
    } catch (dbError) {
      logger.error(`Failed to update job ${jobId} status:`, dbError);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
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
    } catch (error) {
      logger.error(`Failed to get job ${jobId} status:`, error);
      throw error;
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit = 10) {
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
    } catch (error) {
      logger.error(`Failed to get jobs for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      // Update database
      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      // Remove from queue
      this.jobQueue.delete(jobId);
      this.processingJobs.delete(jobId);

      logger.info(`Cancelled analysis job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Register a job processor
   */
  registerProcessor(processor: (data: AnalysisJobData) => Promise<void>): void {
    // Store the processor for all jobs
    for (const [jobId, job] of this.jobQueue.entries()) {
      if (job.status === "waiting") {
        job.processor = processor;
      }
    }
  }

  /**
   * Start the job processor
   */
  private startJobProcessor(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      await this.processNextJob();
    }, 1000); // Check for jobs every second
  }

  /**
   * Process the next job in queue
   */
  private async processNextJob(): Promise<void> {
    if (this.processingJobs.size >= this.maxConcurrentJobs) {
      return; // Already at max capacity
    }

    // Find next waiting job
    const nextJob = Array.from(this.jobQueue.values()).find((job) => job.status === "waiting" && job.processor);

    if (!nextJob) {
      return; // No jobs to process
    }

    // Mark as active
    nextJob.status = "active";
    nextJob.processedAt = new Date();
    this.processingJobs.add(nextJob.id);

    try {
      // Update database status
      await this.prisma.analysisJob.update({
        where: { id: nextJob.id },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // Process the job
      if (nextJob.processor) {
        await nextJob.processor(nextJob.data);
      }

      // Mark as completed
      await this.completeJob(nextJob.id);
    } catch (error) {
      nextJob.attempts++;

      if (nextJob.attempts >= nextJob.maxAttempts) {
        // Max attempts reached, fail the job
        await this.failJob(nextJob.id, error instanceof Error ? error.message : "Unknown error");
      } else {
        // Retry the job
        nextJob.status = "waiting";
        this.processingJobs.delete(nextJob.id);
        logger.warn(`Job ${nextJob.id} failed, retrying (attempt ${nextJob.attempts}/${nextJob.maxAttempts})`);
      }
    }
  }

  /**
   * Stop the job processor
   */
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Wait for active jobs to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.processingJobs.size > 0 && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info("Job manager shutdown complete");
  }

  /**
   * Get queue statistics
   */
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
