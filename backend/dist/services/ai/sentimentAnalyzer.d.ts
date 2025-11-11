import { Comment } from "@prisma/client";
import { SentimentAnalysisResult } from "../../types";
export interface BatchSentimentResult {
    results: SentimentAnalysisResult[];
    summary: {
        totalAnalyzed: number;
        averageConfidence: number;
        sentimentDistribution: {
            positive: number;
            negative: number;
            neutral: number;
        };
    };
}
export interface EmotionScore {
    name: string;
    score: number;
}
export interface PromptTemplates {
    batchSentiment: string;
    singleSentiment: string;
    validation: string;
}
export interface ValidationResult {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
    recommendations: string[];
}
export declare class SentimentAnalyzer {
    private genAI;
    private model;
    private readonly batchSize;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly promptTemplates;
    constructor(apiKey?: string);
    analyzeBatchSentiment(comments: Comment[]): Promise<BatchSentimentResult>;
    analyzeSingleComment(comment: Comment): Promise<SentimentAnalysisResult>;
    private processBatch;
    private initializePromptTemplates;
    private createBatchSentimentPrompt;
    private parseBatchSentimentResponse;
    private normalizeSentiment;
    private normalizeEmotions;
    private validateBatchResults;
    private createFallbackResult;
    private calculateSummary;
    validateResults(results: SentimentAnalysisResult[]): ValidationResult;
    analyzeWithAdvancedProcessing(comments: Comment[], options?: {
        enableValidation?: boolean;
        confidenceThreshold?: number;
        retryLowConfidence?: boolean;
    }): Promise<{
        results: SentimentAnalysisResult[];
        summary: BatchSentimentResult["summary"];
        validation: ValidationResult;
        processingMetrics: {
            totalProcessingTime: number;
            batchCount: number;
            retryCount: number;
            fallbackCount: number;
        };
    }>;
    getProcessingStats(): {
        batchSize: number;
        maxRetries: number;
        retryDelay: number;
    };
    updateProcessingConfig(config: {
        batchSize?: number;
        maxRetries?: number;
        retryDelay?: number;
    }): void;
    private delay;
}
//# sourceMappingURL=sentimentAnalyzer.d.ts.map