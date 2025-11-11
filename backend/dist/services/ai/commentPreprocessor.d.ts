import { Comment } from "@prisma/client";
export interface FilterResult {
    filteredComments: Comment[];
    spamComments: Comment[];
    toxicComments: Comment[];
    filterStats: {
        total: number;
        spam: number;
        toxic: number;
        duplicate: number;
        filtered: number;
    };
}
export interface PreprocessedComment extends Comment {
    cleanedText: string;
    normalizedText: string;
    isSpam: boolean;
    isToxic: boolean;
    spamReasons: string[];
    toxicReasons: string[];
}
export declare class CommentPreprocessor {
    private readonly spamKeywords;
    private readonly toxicKeywords;
    private readonly excessiveCapsThreshold;
    private readonly duplicateThreshold;
    private readonly minCommentLength;
    private readonly maxCommentLength;
    preprocessComments(comments: Comment[]): Promise<FilterResult>;
    private preprocessSingleComment;
    private cleanText;
    private normalizeText;
    private detectSpam;
    private detectToxicity;
    private detectDuplicates;
    private calculateCapsRatio;
    private hasExcessiveRepetition;
    private containsUrls;
    private hasExcessiveEmojis;
    private hasExcessiveProfanity;
    private hasHateSpeechPatterns;
    private calculateSimilarity;
}
//# sourceMappingURL=commentPreprocessor.d.ts.map