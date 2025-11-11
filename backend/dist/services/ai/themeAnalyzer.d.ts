import { Comment, Sentiment } from "@prisma/client";
import { SentimentAnalysisResult } from "../../types";
export interface ThemeCluster {
    id: string;
    name: string;
    comments: Comment[];
    sentiment: Sentiment;
    frequency: number;
    representativeComments: Comment[];
    keywords: string[];
    coherenceScore: number;
}
export interface KeywordData {
    word: string;
    frequency: number;
    sentiment: Sentiment;
    contexts: string[];
    tfidfScore: number;
    sentimentScore: number;
}
export interface ThemeAnalysisResult {
    themes: ThemeCluster[];
    keywords: KeywordData[];
    summary: {
        totalThemes: number;
        totalKeywords: number;
        averageCoherence: number;
        dominantSentiment: Sentiment;
    };
}
export declare class ThemeAnalyzer {
    private readonly minClusterSize;
    private readonly maxClusters;
    private readonly similarityThreshold;
    private readonly minKeywordFrequency;
    private readonly maxKeywords;
    private readonly stopWords;
    analyzeThemes(comments: Comment[], sentimentResults: SentimentAnalysisResult[]): Promise<ThemeAnalysisResult>;
    private preprocessCommentsForClustering;
    private extractKeywords;
    private calculateSimilarityMatrix;
    private calculateJaccardSimilarity;
    private performClustering;
    private generateThemeMetadata;
    private generateThemeName;
    private selectRepresentativeComments;
    private extractThemeKeywords;
    private calculateSummary;
    analyzeThemesWithConfig(comments: Comment[], sentimentResults: SentimentAnalysisResult[], config?: {
        minClusterSize?: number;
        maxClusters?: number;
        similarityThreshold?: number;
        maxKeywords?: number;
    }): Promise<ThemeAnalysisResult>;
    getConfiguration(): {
        minClusterSize: number;
        maxClusters: number;
        similarityThreshold: number;
        minKeywordFrequency: number;
        maxKeywords: number;
        stopWordsCount: number;
    };
}
//# sourceMappingURL=themeAnalyzer.d.ts.map