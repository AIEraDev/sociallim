import { PrismaClient } from "@prisma/client";
import { JobManager } from "./jobManager";
export interface AnalysisStep {
    name: string;
    description: string;
    weight: number;
}
export declare class AnalysisOrchestrationService {
    private prisma;
    private jobManager;
    private commentPreprocessor;
    private sentimentAnalyzer;
    private themeAnalyzer;
    private summaryGenerator;
    private readonly analysisSteps;
    constructor(prisma: PrismaClient, jobManager: JobManager);
    processAnalysis(jobId: string, postId: string, userId: string, commentIds: string[]): Promise<void>;
    private checkExistingAnalysis;
    private handleCachedResult;
    private fetchComments;
    private updateProgress;
    private calculateProgress;
    private saveAnalysisResults;
    getAnalysisPipelineStatus(): Promise<{
        steps: AnalysisStep[];
        totalSteps: number;
    }>;
    estimateAnalysisTime(commentCount: number): number;
    validateAnalysisPrerequisites(postId: string, userId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=analysisOrchestrationService.d.ts.map