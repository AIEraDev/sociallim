import prisma from "../config/prisma";
export declare class DatabaseUtils {
    static checkConnection(): Promise<boolean>;
    static getStats(): Promise<{
        users: number;
        connectedPlatforms: number;
        posts: number;
        comments: number;
        analysisResults: number;
    }>;
    static cleanupOldAnalysis(daysOld?: number): Promise<number>;
    static getUserWithPlatforms(userId: string): Promise<({
        connectedPlatforms: {
            platform: import(".prisma/client").$Enums.Platform;
            id: string;
            userId: string;
            platformUserId: string;
            accessToken: string;
            refreshToken: string | null;
            tokenExpiresAt: Date | null;
            connectedAt: Date;
        }[];
    } & {
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        emailVerified: boolean;
        emailVerificationToken: string | null;
        emailVerificationExpires: Date | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    static getPostWithDetails(postId: string): Promise<({
        user: {
            id: string;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            emailVerified: boolean;
            emailVerificationToken: string | null;
            emailVerificationExpires: Date | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        analysisResults: ({
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
        } & {
            id: string;
            userId: string;
            totalComments: number;
            filteredComments: number;
            summary: string;
            analyzedAt: Date;
            postId: string;
            jobId: string | null;
        })[];
        comments: {
            id: string;
            createdAt: Date;
            text: string;
            publishedAt: Date;
            postId: string;
            likeCount: number;
            platformCommentId: string;
            authorName: string;
            isFiltered: boolean;
            filterReason: string | null;
        }[];
    } & {
        title: string;
        url: string;
        platform: import(".prisma/client").$Enums.Platform;
        id: string;
        createdAt: Date;
        userId: string;
        platformPostId: string;
        publishedAt: Date;
    }) | null>;
    static getAnalysisWithDetails(analysisId: string): Promise<({
        user: {
            id: string;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            emailVerified: boolean;
            emailVerificationToken: string | null;
            emailVerificationExpires: Date | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        post: {
            comments: {
                id: string;
                createdAt: Date;
                text: string;
                publishedAt: Date;
                postId: string;
                likeCount: number;
                platformCommentId: string;
                authorName: string;
                isFiltered: boolean;
                filterReason: string | null;
            }[];
        } & {
            title: string;
            url: string;
            platform: import(".prisma/client").$Enums.Platform;
            id: string;
            createdAt: Date;
            userId: string;
            platformPostId: string;
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
    } & {
        id: string;
        userId: string;
        totalComments: number;
        filteredComments: number;
        summary: string;
        analyzedAt: Date;
        postId: string;
        jobId: string | null;
    }) | null>;
    static disconnect(): Promise<void>;
}
export { prisma };
//# sourceMappingURL=database.d.ts.map