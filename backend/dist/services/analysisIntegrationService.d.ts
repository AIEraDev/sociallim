import { PrismaClient } from "@prisma/client";
export interface CacheConfig {
    enableCaching: boolean;
    cacheTTL: number;
    maxCacheSize: number;
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
export declare class AnalysisIntegrationService {
    private prisma;
    private analysisFactory;
    private cacheConfig;
    private resultCache;
    constructor(prisma: PrismaClient, cacheConfig?: CacheConfig);
    initialize(): Promise<void>;
    requestAnalysis(request: AnalysisRequest): Promise<AnalysisResponse>;
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
    getAnalysisResults(jobId: string): Promise<any>;
    getUserAnalysisHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        includeResults?: boolean;
        fromCache?: boolean;
    }): Promise<any>;
    compareAnalyses(jobIds: string[]): Promise<{
        results: any[];
        comparison: {
            sentimentComparison: {
                id: any;
                positive: any;
                negative: any;
                neutral: any;
            }[];
            avgSentiment: {
                positive: number;
                negative: number;
                neutral: number;
            };
            commentCounts: any[];
            avgComments: number;
            trends: {
                sentiment: string;
                engagement: string;
                sentimentChange?: undefined;
                engagementChange?: undefined;
            } | {
                sentiment: string;
                engagement: string;
                sentimentChange: number;
                engagementChange: number;
            };
        };
        totalAnalyses: number;
        comparedAt: Date;
    }>;
    getSystemHealth(): Promise<{
        system: {
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
        };
        cache: {
            totalEntries: number;
            validEntries: number;
            expiredEntries: number;
            maxSize: number;
            hitRate: number;
            config: CacheConfig;
        };
        timestamp: Date;
    }>;
    performMaintenance(): Promise<{
        factory: {
            jobsCleanedUp: boolean;
            cacheCleared: boolean;
            errors: string[];
        };
        cache: {
            entriesBefore: number;
            entriesAfter: number;
            entriesCleaned: number;
            success: boolean;
        };
        timestamp: Date;
    }>;
    private checkDatabaseCache;
    private getCachedResult;
    private setCachedResult;
    private getCachedResultByJobId;
    private setCachedResultByJobId;
    private getCachedData;
    private setCachedData;
    private scheduleResultCaching;
    private calculateComparisonMetrics;
    private calculateTrends;
    private getCacheStats;
    private performCacheMaintenance;
    updateCacheConfig(config: Partial<CacheConfig>): void;
    clearCache(): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=analysisIntegrationService.d.ts.map