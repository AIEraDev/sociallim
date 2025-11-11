import { PrismaClient } from "@prisma/client";
import { JobManager } from "./jobManager";
import { AnalysisOrchestrationService } from "./analysisOrchestrationService";
export interface AnalysisServiceConfig {
    jobConfig?: {
        maxConcurrentJobs?: number;
        batchSize?: number;
        maxRetries?: number;
        retryDelay?: number;
    };
}
export declare class AnalysisServiceFactory {
    private static instance;
    private jobManager;
    private orchestrationService;
    private prisma;
    private config;
    private constructor();
    static getInstance(prisma?: PrismaClient, config?: AnalysisServiceConfig): AnalysisServiceFactory;
    initialize(): Promise<void>;
    getJobManager(): JobManager;
    getOrchestrationService(): AnalysisOrchestrationService;
    startAnalysis(postId: string, userId: string, options?: {
        skipValidation?: boolean;
        priority?: "low" | "normal" | "high";
        estimateOnly?: boolean;
    }): Promise<{
        jobId?: string;
        estimatedTime?: number;
        validation: {
            valid: boolean;
            errors: string[];
        };
        cached?: boolean;
    }>;
    getAnalysisStatus(jobId: string): Promise<{
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
    getAnalysisResults(jobId: string): Promise<{
        id: string;
        summary: string;
        totalComments: number;
        filteredComments: number;
        analyzedAt: Date;
        post: {
            title: string;
            platform: import(".prisma/client").$Enums.Platform;
            publishedAt: Date;
        };
        sentimentBreakdown: {
            positive: number;
            negative: number;
            id: string;
            neutral: number;
            confidenceScore: number;
            analysisResultId: string;
        } | null;
        emotions: {
            name: string;
            id: string;
            analysisResultId: string;
            percentage: number;
        }[];
        themes: {
            name: string;
            id: string;
            analysisResultId: string;
            frequency: number;
            sentiment: import(".prisma/client").$Enums.Sentiment;
            exampleComments: string[];
        }[];
        keywords: {
            id: string;
            analysisResultId: string;
            frequency: number;
            sentiment: import(".prisma/client").$Enums.Sentiment;
            word: string;
            contexts: string[];
        }[];
    }>;
    cancelAnalysis(jobId: string): Promise<void>;
    retryAnalysis(jobId: string): Promise<void>;
    getUserAnalysisHistory(userId: string, limit?: number, offset?: number): Promise<{
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
    getSystemStats(): Promise<{
        queue: {
            waiting: number;
            active: number;
            total: number;
            maxConcurrent: number;
        };
        pipeline: {
            steps: import("./analysisOrchestrationService").AnalysisStep[];
            totalSteps: number;
        };
        database: {
            totalUsers: number;
            totalPosts: number;
            totalComments: number;
            totalAnalyses: number;
            recentAnalyses: number;
        };
        uptime: number;
        memory: NodeJS.MemoryUsage;
    }>;
    performMaintenance(): Promise<{
        jobsCleanedUp: boolean;
        cacheCleared: boolean;
        errors: string[];
    }>;
    shutdown(): Promise<void>;
    private checkForExistingAnalysis;
    private getJobOptions;
    private getDatabaseStats;
    updateConfig(config: Partial<AnalysisServiceConfig>): void;
    getConfig(): AnalysisServiceConfig;
}
//# sourceMappingURL=analysisServiceFactory.d.ts.map