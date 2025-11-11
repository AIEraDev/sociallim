"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisOrchestrationService = void 0;
const client_1 = require("@prisma/client");
const commentPreprocessor_1 = require("./ai/commentPreprocessor");
const sentimentAnalyzer_1 = require("./ai/sentimentAnalyzer");
const themeAnalyzer_1 = require("./ai/themeAnalyzer");
const summaryGenerator_1 = require("./ai/summaryGenerator");
const logger_1 = require("../utils/logger");
class AnalysisOrchestrationService {
    constructor(prisma, jobManager) {
        this.analysisSteps = [
            { name: "preprocessing", description: "Preprocessing comments and filtering spam", weight: 0.2 },
            { name: "sentiment", description: "Analyzing sentiment and emotions", weight: 0.3 },
            { name: "themes", description: "Extracting themes and keywords", weight: 0.3 },
            { name: "summary", description: "Generating summary and insights", weight: 0.15 },
            { name: "saving", description: "Saving results to database", weight: 0.05 },
        ];
        this.prisma = prisma;
        this.jobManager = jobManager;
        this.commentPreprocessor = new commentPreprocessor_1.CommentPreprocessor();
        this.sentimentAnalyzer = new sentimentAnalyzer_1.SentimentAnalyzer();
        this.themeAnalyzer = new themeAnalyzer_1.ThemeAnalyzer();
        this.summaryGenerator = new summaryGenerator_1.SummaryGenerator();
    }
    async processAnalysis(jobId, postId, userId, commentIds) {
        try {
            logger_1.logger.info(`Starting analysis orchestration for job ${jobId}`);
            const existingResult = await this.checkExistingAnalysis(postId);
            if (existingResult) {
                await this.handleCachedResult(jobId, existingResult);
                return;
            }
            const comments = await this.fetchComments(commentIds);
            if (comments.length === 0) {
                throw new Error("No comments found for analysis");
            }
            let currentProgress = 0;
            let stepIndex = 0;
            await this.updateProgress(jobId, stepIndex, "Preprocessing comments and filtering spam");
            const preprocessedComments = await this.commentPreprocessor.preprocessComments(comments);
            currentProgress += this.analysisSteps[stepIndex].weight;
            stepIndex++;
            await this.updateProgress(jobId, stepIndex, "Analyzing sentiment and emotions");
            const sentimentResults = await this.sentimentAnalyzer.analyzeBatchSentiment(preprocessedComments.filteredComments);
            currentProgress += this.analysisSteps[stepIndex].weight;
            stepIndex++;
            await this.updateProgress(jobId, stepIndex, "Extracting themes and keywords");
            const themeResults = await this.themeAnalyzer.analyzeThemes(preprocessedComments.filteredComments, sentimentResults.results);
            currentProgress += this.analysisSteps[stepIndex].weight;
            stepIndex++;
            await this.updateProgress(jobId, stepIndex, "Generating summary and insights");
            const summary = await this.summaryGenerator.generateSummary({
                sentimentBreakdown: sentimentResults.summary.sentimentDistribution,
                themes: themeResults.themes,
                keywords: themeResults.keywords,
                totalComments: comments.length,
                filteredComments: preprocessedComments.spamComments.length + preprocessedComments.toxicComments.length,
            });
            currentProgress += this.analysisSteps[stepIndex].weight;
            stepIndex++;
            await this.updateProgress(jobId, stepIndex, "Saving results to database");
            await this.saveAnalysisResults(jobId, postId, userId, {
                totalComments: comments.length,
                filteredComments: preprocessedComments.spamComments.length + preprocessedComments.toxicComments.length,
                summary: summary.summary,
                sentimentResults,
                themeResults,
                emotions: summary.emotions,
                keywords: themeResults.keywords,
            });
            await this.jobManager.updateJobProgress(jobId, { progress: 100, currentStep: this.analysisSteps.length, stepDescription: "Analysis completed" }, client_1.JobStatus.COMPLETED);
            logger_1.logger.info(`Analysis orchestration completed for job ${jobId}`);
        }
        catch (error) {
            logger_1.logger.error(`Analysis orchestration failed for job ${jobId}:`, error);
            await this.jobManager.markJobFailed(jobId, error instanceof Error ? error.message : "Unknown error");
            throw error;
        }
    }
    async checkExistingAnalysis(postId) {
        try {
            const existingResult = await this.prisma.analysisResult.findFirst({
                where: { postId },
                include: {
                    sentimentBreakdown: true,
                    emotions: true,
                    themes: true,
                    keywords: true,
                },
                orderBy: { analyzedAt: "desc" },
            });
            if (existingResult) {
                const hoursSinceAnalysis = (Date.now() - existingResult.analyzedAt.getTime()) / (1000 * 60 * 60);
                if (hoursSinceAnalysis < 24) {
                    logger_1.logger.info(`Found recent analysis for post ${postId}, using cached result`);
                    return existingResult;
                }
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error checking existing analysis for post ${postId}:`, error);
            return null;
        }
    }
    async handleCachedResult(jobId, existingResult) {
        try {
            await this.prisma.analysisResult.update({
                where: { id: existingResult.id },
                data: { jobId },
            });
            await this.jobManager.updateJobProgress(jobId, {
                progress: 100,
                currentStep: this.analysisSteps.length,
                stepDescription: "Used cached analysis result",
            }, client_1.JobStatus.COMPLETED);
            logger_1.logger.info(`Used cached analysis result for job ${jobId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error handling cached result for job ${jobId}:`, error);
            throw error;
        }
    }
    async fetchComments(commentIds) {
        try {
            const comments = await this.prisma.comment.findMany({
                where: {
                    id: { in: commentIds },
                    isFiltered: false,
                },
                orderBy: { publishedAt: "desc" },
            });
            return comments;
        }
        catch (error) {
            logger_1.logger.error("Error fetching comments:", error);
            throw new Error("Failed to fetch comments for analysis");
        }
    }
    async updateProgress(jobId, stepIndex, description) {
        const progress = this.calculateProgress(stepIndex);
        await this.jobManager.updateJobProgress(jobId, {
            progress,
            currentStep: stepIndex + 1,
            stepDescription: description,
        });
    }
    calculateProgress(completedStepIndex) {
        let totalWeight = 0;
        for (let i = 0; i < completedStepIndex; i++) {
            totalWeight += this.analysisSteps[i].weight;
        }
        return Math.round(totalWeight * 100);
    }
    async saveAnalysisResults(jobId, postId, userId, results) {
        try {
            await this.prisma.$transaction(async (tx) => {
                const analysisResult = await tx.analysisResult.create({
                    data: {
                        jobId,
                        postId,
                        userId,
                        totalComments: results.totalComments,
                        filteredComments: results.filteredComments,
                        summary: results.summary,
                    },
                });
                if (results.sentimentResults.breakdown) {
                    await tx.sentimentBreakdown.create({
                        data: {
                            analysisResultId: analysisResult.id,
                            positive: results.sentimentResults.breakdown.positive,
                            negative: results.sentimentResults.breakdown.negative,
                            neutral: results.sentimentResults.breakdown.neutral,
                            confidenceScore: results.sentimentResults.confidenceScore || 0.8,
                        },
                    });
                }
                if (results.emotions && results.emotions.length > 0) {
                    await tx.emotion.createMany({
                        data: results.emotions.map((emotion) => ({
                            analysisResultId: analysisResult.id,
                            name: emotion.name,
                            percentage: emotion.percentage,
                        })),
                    });
                }
                if (results.themeResults.themes && results.themeResults.themes.length > 0) {
                    await tx.theme.createMany({
                        data: results.themeResults.themes.map((theme) => ({
                            analysisResultId: analysisResult.id,
                            name: theme.name,
                            frequency: theme.frequency,
                            sentiment: theme.sentiment,
                            exampleComments: theme.exampleComments || [],
                        })),
                    });
                }
                if (results.keywords && results.keywords.length > 0) {
                    await tx.keyword.createMany({
                        data: results.keywords.map((keyword) => ({
                            analysisResultId: analysisResult.id,
                            word: keyword.word,
                            frequency: keyword.frequency,
                            sentiment: keyword.sentiment,
                            contexts: keyword.contexts || [],
                        })),
                    });
                }
                logger_1.logger.info(`Saved analysis results for job ${jobId}`);
            });
        }
        catch (error) {
            logger_1.logger.error(`Error saving analysis results for job ${jobId}:`, error);
            throw new Error("Failed to save analysis results");
        }
    }
    async getAnalysisPipelineStatus() {
        return {
            steps: this.analysisSteps,
            totalSteps: this.analysisSteps.length,
        };
    }
    estimateAnalysisTime(commentCount) {
        const baseTime = 10;
        const timePerComment = 0.1;
        const maxTime = 300;
        const estimatedTime = baseTime + commentCount * timePerComment;
        return Math.min(estimatedTime, maxTime);
    }
    async validateAnalysisPrerequisites(postId, userId) {
        const errors = [];
        try {
            const post = await this.prisma.post.findFirst({
                where: { id: postId, userId },
                include: { comments: true },
            });
            if (!post) {
                errors.push("Post not found or access denied");
            }
            else {
                if (post.comments.length === 0) {
                    errors.push("Post has no comments to analyze");
                }
                const validComments = post.comments.filter((c) => !c.isFiltered);
                if (validComments.length < 5) {
                    errors.push("Post needs at least 5 valid comments for meaningful analysis");
                }
            }
            const connectedPlatforms = await this.prisma.connectedPlatform.findMany({
                where: { userId },
            });
            if (connectedPlatforms.length === 0) {
                errors.push("User has no connected social media platforms");
            }
            return {
                valid: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            logger_1.logger.error("Error validating analysis prerequisites:", error);
            return {
                valid: false,
                errors: ["Failed to validate analysis prerequisites"],
            };
        }
    }
}
exports.AnalysisOrchestrationService = AnalysisOrchestrationService;
//# sourceMappingURL=analysisOrchestrationService.js.map