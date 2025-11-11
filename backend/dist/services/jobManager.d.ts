import { PrismaClient } from "@prisma/client";
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
export declare class JobManager {
    private jobQueue;
    private processingJobs;
    private prisma;
    private maxConcurrentJobs;
    private processingInterval;
    constructor(prisma: PrismaClient, config?: any);
    createJob(postId: string, userId: string, totalComments: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
        status: import(".prisma/client").$Enums.JobStatus;
        progress: number;
        totalSteps: number;
        currentStep: number;
        stepDescription: string | null;
        errorMessage: string | null;
        retryCount: number;
        maxRetries: number;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    queueAnalysisJob(postId: string, userId: string, commentIds: string[]): Promise<string>;
    updateJobProgress(jobId: string, progress: JobProgress): Promise<void>;
    completeJob(jobId: string): Promise<void>;
    failJob(jobId: string, error: string): Promise<void>;
    getJobStatus(jobId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.JobStatus;
        progress: number;
        totalSteps: number;
        currentStep: number;
        stepDescription: string | null;
        errorMessage: string | null;
        createdAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
        post: {
            title: string;
            platform: import(".prisma/client").$Enums.Platform;
        };
    }>;
    getUserJobs(userId: string, limit?: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.JobStatus;
        progress: number;
        totalSteps: number;
        currentStep: number;
        stepDescription: string | null;
        errorMessage: string | null;
        createdAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
        post: {
            title: string;
            platform: import(".prisma/client").$Enums.Platform;
        };
    }[]>;
    cancelJob(jobId: string): Promise<void>;
    registerProcessor(processor: (data: AnalysisJobData) => Promise<void>): void;
    private startJobProcessor;
    private processNextJob;
    shutdown(): Promise<void>;
    getQueueStats(): {
        waiting: number;
        active: number;
        total: number;
        maxConcurrent: number;
    };
}
//# sourceMappingURL=jobManager.d.ts.map