"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const database_1 = require("../config/database");
const joi_1 = __importDefault(require("joi"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const csv_writer_1 = require("csv-writer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const analysisIdSchema = joi_1.default.object({
    id: joi_1.default.string().required().messages({
        "any.required": "Analysis ID is required",
    }),
});
const compareAnalysisSchema = joi_1.default.object({
    analysisIds: joi_1.default.array().items(joi_1.default.string()).min(2).max(10).required().messages({
        "array.min": "At least 2 analysis IDs are required for comparison",
        "array.max": "Maximum 10 analyses can be compared at once",
        "any.required": "Analysis IDs are required",
    }),
});
const exportSchema = joi_1.default.object({
    format: joi_1.default.string().valid("pdf", "csv").required().messages({
        "any.only": "Format must be either 'pdf' or 'csv'",
        "any.required": "Export format is required",
    }),
    includeComments: joi_1.default.boolean().default(false),
    includeCharts: joi_1.default.boolean().default(true),
});
const historyQuerySchema = joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    offset: joi_1.default.number().integer().min(0).default(0),
    includeResults: joi_1.default.boolean().default(false),
});
router.get("/:id/results", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error } = analysisIdSchema.validate(req.params);
        if (error) {
            res.status(400).json({
                error: "Invalid analysis ID",
                message: error.details[0].message,
            });
            return;
        }
        const { id: analysisId } = req.params;
        const userId = req.user.id;
        const analysisResult = await database_1.prisma.analysisResult.findFirst({
            where: {
                id: analysisId,
                userId,
            },
            include: {
                sentimentBreakdown: true,
                emotions: true,
                themes: {
                    orderBy: { frequency: "desc" },
                },
                keywords: {
                    orderBy: { frequency: "desc" },
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        platform: true,
                        url: true,
                        publishedAt: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        status: true,
                        completedAt: true,
                    },
                },
            },
        });
        if (!analysisResult) {
            res.status(404).json({
                error: "Analysis not found",
                message: "Analysis result not found or access denied",
            });
            return;
        }
        const topThemes = analysisResult.themes.slice(0, 5);
        const topKeywords = analysisResult.keywords.slice(0, 10);
        const emotionsSorted = analysisResult.emotions.sort((a, b) => b.percentage - a.percentage);
        const engagementScore = calculateEngagementScore(analysisResult);
        const sentimentScore = calculateSentimentScore(analysisResult.sentimentBreakdown);
        res.status(200).json({
            message: "Analysis results retrieved successfully",
            data: {
                id: analysisResult.id,
                summary: analysisResult.summary,
                analyzedAt: analysisResult.analyzedAt,
                totalComments: analysisResult.totalComments,
                filteredComments: analysisResult.filteredComments,
                validComments: analysisResult.totalComments - analysisResult.filteredComments,
                post: analysisResult.post,
                job: analysisResult.job,
                sentimentBreakdown: analysisResult.sentimentBreakdown,
                emotions: emotionsSorted,
                themes: topThemes,
                keywords: topKeywords,
                metrics: {
                    engagementScore,
                    sentimentScore,
                    filterRate: (analysisResult.filteredComments / analysisResult.totalComments) * 100,
                    diversityScore: calculateDiversityScore(analysisResult.themes),
                },
            },
        });
    }
    catch (error) {
        console.error("Get analysis results error:", error);
        res.status(500).json({
            error: "Failed to get analysis results",
            message: "An error occurred while retrieving analysis results",
        });
    }
});
router.get("/compare", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error, value } = compareAnalysisSchema.validate(req.query);
        if (error) {
            res.status(400).json({
                error: "Invalid query parameters",
                message: error.details[0].message,
            });
            return;
        }
        const { analysisIds } = value;
        const userId = req.user.id;
        const analysisResults = await database_1.prisma.analysisResult.findMany({
            where: {
                id: { in: analysisIds },
                userId,
            },
            include: {
                sentimentBreakdown: true,
                emotions: true,
                themes: true,
                keywords: true,
                post: {
                    select: {
                        id: true,
                        title: true,
                        platform: true,
                        publishedAt: true,
                    },
                },
            },
            orderBy: { analyzedAt: "desc" },
        });
        if (analysisResults.length < 2) {
            res.status(400).json({
                error: "Insufficient data",
                message: "At least 2 valid analysis results are required for comparison",
            });
            return;
        }
        const comparison = calculateComparisonMetrics(analysisResults);
        const trends = calculateTrends(analysisResults);
        const insights = generateComparisonInsights(analysisResults, comparison, trends);
        res.status(200).json({
            message: "Analysis comparison completed successfully",
            data: {
                analyses: analysisResults.map((result) => ({
                    id: result.id,
                    post: result.post,
                    analyzedAt: result.analyzedAt,
                    totalComments: result.totalComments,
                    sentimentBreakdown: result.sentimentBreakdown,
                    topThemes: result.themes.slice(0, 3),
                    topEmotions: result.emotions.sort((a, b) => b.percentage - a.percentage).slice(0, 3),
                })),
                comparison,
                trends,
                insights,
                comparedAt: new Date(),
            },
        });
    }
    catch (error) {
        console.error("Compare analysis error:", error);
        res.status(500).json({
            error: "Failed to compare analyses",
            message: "An error occurred while comparing analysis results",
        });
    }
});
router.post("/:id/export", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error: paramError } = analysisIdSchema.validate(req.params);
        if (paramError) {
            res.status(400).json({
                error: "Invalid analysis ID",
                message: paramError.details[0].message,
            });
            return;
        }
        const { error: bodyError, value } = exportSchema.validate(req.body);
        if (bodyError) {
            res.status(400).json({
                error: "Invalid export parameters",
                message: bodyError.details[0].message,
            });
            return;
        }
        const { id: analysisId } = req.params;
        const { format, includeComments, includeCharts } = value;
        const userId = req.user.id;
        const analysisResult = await database_1.prisma.analysisResult.findFirst({
            where: {
                id: analysisId,
                userId,
            },
            include: {
                sentimentBreakdown: true,
                emotions: true,
                themes: true,
                keywords: true,
                post: {
                    include: {
                        comments: includeComments
                            ? {
                                where: { isFiltered: false },
                                orderBy: { publishedAt: "desc" },
                            }
                            : false,
                    },
                },
            },
        });
        if (!analysisResult) {
            res.status(404).json({
                error: "Analysis not found",
                message: "Analysis result not found or access denied",
            });
            return;
        }
        let filePath;
        let fileName;
        if (format === "pdf") {
            const result = await generatePDFReport(analysisResult, includeComments, includeCharts);
            filePath = result.filePath;
            fileName = result.fileName;
        }
        else {
            const result = await generateCSVReport(analysisResult, includeComments);
            filePath = result.filePath;
            fileName = result.fileName;
        }
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", format === "pdf" ? "application/pdf" : "text/csv");
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on("end", () => {
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error("Error deleting temporary file:", err);
            });
        });
    }
    catch (error) {
        console.error("Export analysis error:", error);
        res.status(500).json({
            error: "Failed to export analysis",
            message: "An error occurred while exporting analysis results",
        });
    }
});
router.get("/history", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error, value } = historyQuerySchema.validate(req.query);
        if (error) {
            res.status(400).json({
                error: "Invalid query parameters",
                message: error.details[0].message,
            });
            return;
        }
        const { limit, offset, includeResults } = value;
        const userId = req.user.id;
        const analyses = await database_1.prisma.analysisResult.findMany({
            where: { userId },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        platform: true,
                        publishedAt: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        completedAt: true,
                    },
                },
                ...(includeResults && {
                    sentimentBreakdown: true,
                    emotions: true,
                    themes: {
                        take: 3,
                        orderBy: { frequency: "desc" },
                    },
                }),
            },
            orderBy: { analyzedAt: "desc" },
            take: limit,
            skip: offset,
        });
        const totalCount = await database_1.prisma.analysisResult.count({
            where: { userId },
        });
        const stats = await calculateUserStats(userId);
        res.status(200).json({
            message: "Analysis history retrieved successfully",
            data: {
                analyses: analyses.map((analysis) => ({
                    id: analysis.id,
                    summary: analysis.summary,
                    analyzedAt: analysis.analyzedAt,
                    totalComments: analysis.totalComments,
                    filteredComments: analysis.filteredComments,
                    post: analysis.post,
                    job: analysis.job,
                    ...(includeResults && {
                        sentimentBreakdown: analysis.sentimentBreakdown,
                        topEmotions: analysis.emotions?.sort((a, b) => b.percentage - a.percentage).slice(0, 3),
                        topThemes: analysis.themes,
                    }),
                })),
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: offset + limit < totalCount,
                },
                stats,
            },
        });
    }
    catch (error) {
        console.error("Get analysis history error:", error);
        res.status(500).json({
            error: "Failed to get analysis history",
            message: "An error occurred while retrieving analysis history",
        });
    }
});
function calculateEngagementScore(analysisResult) {
    const validComments = analysisResult.totalComments - analysisResult.filteredComments;
    const filterRate = analysisResult.filteredComments / analysisResult.totalComments;
    const volumeScore = Math.min((validComments / 100) * 40, 40);
    const qualityScore = (1 - filterRate) * 30;
    const diversityScore = Math.min(analysisResult.themes?.length || 0, 10) * 3;
    return Math.round(volumeScore + qualityScore + diversityScore);
}
function calculateSentimentScore(sentimentBreakdown) {
    if (!sentimentBreakdown)
        return 50;
    const { positive, negative, neutral } = sentimentBreakdown;
    return Math.round(positive * 100 + neutral * 50 + negative * 0);
}
function calculateDiversityScore(themes) {
    if (!themes || themes.length === 0)
        return 0;
    const total = themes.reduce((sum, theme) => sum + theme.frequency, 0);
    const entropy = themes.reduce((sum, theme) => {
        const p = theme.frequency / total;
        return sum - p * Math.log2(p);
    }, 0);
    return Math.round(Math.min((entropy / Math.log2(themes.length)) * 100, 100));
}
function calculateComparisonMetrics(analyses) {
    const sentimentComparison = analyses.map((analysis) => ({
        id: analysis.id,
        title: analysis.post.title,
        platform: analysis.post.platform,
        analyzedAt: analysis.analyzedAt,
        positive: analysis.sentimentBreakdown?.positive || 0,
        negative: analysis.sentimentBreakdown?.negative || 0,
        neutral: analysis.sentimentBreakdown?.neutral || 0,
        totalComments: analysis.totalComments,
    }));
    const avgSentiment = {
        positive: sentimentComparison.reduce((sum, s) => sum + s.positive, 0) / analyses.length,
        negative: sentimentComparison.reduce((sum, s) => sum + s.negative, 0) / analyses.length,
        neutral: sentimentComparison.reduce((sum, s) => sum + s.neutral, 0) / analyses.length,
    };
    const commentStats = {
        total: sentimentComparison.reduce((sum, s) => sum + s.totalComments, 0),
        average: sentimentComparison.reduce((sum, s) => sum + s.totalComments, 0) / analyses.length,
        min: Math.min(...sentimentComparison.map((s) => s.totalComments)),
        max: Math.max(...sentimentComparison.map((s) => s.totalComments)),
    };
    return {
        sentimentComparison,
        avgSentiment,
        commentStats,
    };
}
function calculateTrends(analyses) {
    if (analyses.length < 2)
        return null;
    const sorted = analyses.sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const sentimentTrend = {
        positive: last.sentimentBreakdown?.positive - first.sentimentBreakdown?.positive || 0,
        negative: last.sentimentBreakdown?.negative - first.sentimentBreakdown?.negative || 0,
        neutral: last.sentimentBreakdown?.neutral - first.sentimentBreakdown?.neutral || 0,
    };
    const engagementTrend = (last.totalComments - first.totalComments) / first.totalComments;
    return {
        sentiment: sentimentTrend,
        engagement: engagementTrend,
        timespan: {
            from: first.analyzedAt,
            to: last.analyzedAt,
            days: Math.ceil((new Date(last.analyzedAt).getTime() - new Date(first.analyzedAt).getTime()) / (1000 * 60 * 60 * 24)),
        },
    };
}
function generateComparisonInsights(analyses, comparison, trends) {
    const insights = [];
    const bestSentiment = comparison.sentimentComparison.reduce((best, current) => (current.positive > best.positive ? current : best));
    insights.push({
        type: "best_sentiment",
        message: `"${bestSentiment.title}" had the most positive sentiment at ${(bestSentiment.positive * 100).toFixed(1)}%`,
        data: bestSentiment,
    });
    const mostEngaging = comparison.sentimentComparison.reduce((best, current) => (current.totalComments > best.totalComments ? current : best));
    insights.push({
        type: "most_engaging",
        message: `"${mostEngaging.title}" received the most comments with ${mostEngaging.totalComments} total`,
        data: mostEngaging,
    });
    if (trends) {
        if (trends.sentiment.positive > 0.1) {
            insights.push({
                type: "positive_trend",
                message: `Sentiment is improving over time with a ${(trends.sentiment.positive * 100).toFixed(1)}% increase in positive feedback`,
                data: trends.sentiment,
            });
        }
        else if (trends.sentiment.positive < -0.1) {
            insights.push({
                type: "negative_trend",
                message: `Sentiment is declining over time with a ${Math.abs(trends.sentiment.positive * 100).toFixed(1)}% decrease in positive feedback`,
                data: trends.sentiment,
            });
        }
    }
    return insights;
}
async function calculateUserStats(userId) {
    const [totalAnalyses, avgSentiment, totalComments] = await Promise.all([
        database_1.prisma.analysisResult.count({ where: { userId } }),
        database_1.prisma.analysisResult.aggregate({
            where: { userId },
            _avg: {
                totalComments: true,
            },
        }),
        database_1.prisma.analysisResult.aggregate({
            where: { userId },
            _sum: {
                totalComments: true,
            },
        }),
    ]);
    const recentAnalyses = await database_1.prisma.analysisResult.findMany({
        where: {
            userId,
            analyzedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
        },
        include: { sentimentBreakdown: true },
    });
    const avgRecentSentiment = recentAnalyses.length > 0
        ? {
            positive: recentAnalyses.reduce((sum, a) => sum + (a.sentimentBreakdown?.positive || 0), 0) / recentAnalyses.length,
            negative: recentAnalyses.reduce((sum, a) => sum + (a.sentimentBreakdown?.negative || 0), 0) / recentAnalyses.length,
            neutral: recentAnalyses.reduce((sum, a) => sum + (a.sentimentBreakdown?.neutral || 0), 0) / recentAnalyses.length,
        }
        : null;
    return {
        totalAnalyses,
        avgCommentsPerAnalysis: Math.round(avgSentiment._avg.totalComments || 0),
        totalCommentsAnalyzed: totalComments._sum.totalComments || 0,
        analysesLast30Days: recentAnalyses.length,
        avgRecentSentiment,
    };
}
async function generatePDFReport(analysisResult, includeComments, includeCharts) {
    const fileName = `analysis-report-${analysisResult.id}-${Date.now()}.pdf`;
    const filePath = path_1.default.join("/tmp", fileName);
    const doc = new pdfkit_1.default();
    doc.pipe(fs_1.default.createWriteStream(filePath));
    doc.fontSize(20).text("Comment Sentiment Analysis Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text("Post Information");
    doc
        .fontSize(12)
        .text(`Title: ${analysisResult.post.title}`)
        .text(`Platform: ${analysisResult.post.platform}`)
        .text(`Published: ${new Date(analysisResult.post.publishedAt).toLocaleDateString()}`)
        .text(`Analyzed: ${new Date(analysisResult.analyzedAt).toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(16).text("Summary");
    doc.fontSize(12).text(analysisResult.summary);
    doc.moveDown();
    doc.fontSize(16).text("Statistics");
    doc
        .fontSize(12)
        .text(`Total Comments: ${analysisResult.totalComments}`)
        .text(`Valid Comments: ${analysisResult.totalComments - analysisResult.filteredComments}`)
        .text(`Filtered Comments: ${analysisResult.filteredComments}`);
    doc.moveDown();
    if (analysisResult.sentimentBreakdown) {
        doc.fontSize(16).text("Sentiment Breakdown");
        doc
            .fontSize(12)
            .text(`Positive: ${(analysisResult.sentimentBreakdown.positive * 100).toFixed(1)}%`)
            .text(`Negative: ${(analysisResult.sentimentBreakdown.negative * 100).toFixed(1)}%`)
            .text(`Neutral: ${(analysisResult.sentimentBreakdown.neutral * 100).toFixed(1)}%`);
        doc.moveDown();
    }
    if (analysisResult.themes && analysisResult.themes.length > 0) {
        doc.fontSize(16).text("Top Themes");
        analysisResult.themes.slice(0, 5).forEach((theme) => {
            doc.fontSize(12).text(`• ${theme.name} (${theme.frequency} mentions, ${theme.sentiment})`);
        });
        doc.moveDown();
    }
    if (analysisResult.keywords && analysisResult.keywords.length > 0) {
        doc.fontSize(16).text("Top Keywords");
        analysisResult.keywords.slice(0, 10).forEach((keyword) => {
            doc.fontSize(12).text(`• ${keyword.word} (${keyword.frequency} mentions)`);
        });
        doc.moveDown();
    }
    if (includeComments && analysisResult.post.comments) {
        doc.addPage();
        doc.fontSize(16).text("Sample Comments");
        analysisResult.post.comments.slice(0, 20).forEach((comment) => {
            doc
                .fontSize(10)
                .text(`${comment.authorName}: ${comment.text.substring(0, 200)}${comment.text.length > 200 ? "..." : ""}`)
                .text(`Published: ${new Date(comment.publishedAt).toLocaleDateString()}`)
                .moveDown(0.5);
        });
    }
    doc.end();
    return { filePath, fileName };
}
async function generateCSVReport(analysisResult, includeComments) {
    const fileName = `analysis-data-${analysisResult.id}-${Date.now()}.csv`;
    const filePath = path_1.default.join("/tmp", fileName);
    if (includeComments && analysisResult.post.comments) {
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: filePath,
            header: [
                { id: "authorName", title: "Author" },
                { id: "text", title: "Comment" },
                { id: "publishedAt", title: "Published Date" },
                { id: "likeCount", title: "Likes" },
            ],
        });
        await csvWriter.writeRecords(analysisResult.post.comments);
    }
    else {
        const summaryData = [
            { metric: "Total Comments", value: analysisResult.totalComments },
            { metric: "Valid Comments", value: analysisResult.totalComments - analysisResult.filteredComments },
            { metric: "Filtered Comments", value: analysisResult.filteredComments },
            { metric: "Positive Sentiment", value: `${(analysisResult.sentimentBreakdown?.positive * 100 || 0).toFixed(1)}%` },
            { metric: "Negative Sentiment", value: `${(analysisResult.sentimentBreakdown?.negative * 100 || 0).toFixed(1)}%` },
            { metric: "Neutral Sentiment", value: `${(analysisResult.sentimentBreakdown?.neutral * 100 || 0).toFixed(1)}%` },
        ];
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: filePath,
            header: [
                { id: "metric", title: "Metric" },
                { id: "value", title: "Value" },
            ],
        });
        await csvWriter.writeRecords(summaryData);
    }
    return { filePath, fileName };
}
exports.default = router;
//# sourceMappingURL=analysisRoutes.js.map