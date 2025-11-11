import { ThemeCluster, KeywordData } from "./themeAnalyzer";
export interface EmotionAnalysis {
    name: string;
    prevalence: number;
    description: string;
    representativeComments: string[];
}
export interface SummaryData {
    sentimentBreakdown: {
        positive: number;
        negative: number;
        neutral: number;
    };
    themes: ThemeCluster[];
    keywords: KeywordData[];
    totalComments: number;
    filteredComments: number;
}
export interface GeneratedSummary {
    summary: string;
    emotions: EmotionAnalysis[];
    keyInsights: string[];
    recommendations: string[];
    qualityScore: number;
    wordCount: number;
}
export interface SummaryValidation {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
    recommendations: string[];
    lengthCheck: {
        wordCount: number;
        isWithinRange: boolean;
        targetRange: [number, number];
    };
}
export declare class SummaryGenerator {
    private genAI;
    private model;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly targetWordRange;
    private readonly maxSummaryLength;
    private readonly minQualityScore;
    constructor(apiKey?: string);
    generateSummary(summaryData: SummaryData): Promise<GeneratedSummary>;
    private generateMainSummary;
    private createSummaryPrompt;
    private analyzeEmotions;
    private inferEmotionFromTheme;
    private getEmotionDescription;
    private generateKeyInsights;
    private generateRecommendations;
    private cleanSummaryText;
    validateSummary(summary: GeneratedSummary, originalData: SummaryData): SummaryValidation;
    private createEmptySummary;
    private generateFallbackSummary;
    private delay;
    getConfiguration(): {
        maxRetries: number;
        retryDelay: number;
        targetWordRange: [number, number];
        maxSummaryLength: number;
        minQualityScore: number;
    };
    updateConfiguration(config: {
        targetWordRange?: [number, number];
        maxSummaryLength?: number;
        minQualityScore?: number;
    }): void;
}
//# sourceMappingURL=summaryGenerator.d.ts.map