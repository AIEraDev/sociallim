"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysisOrchestrationService_1 = require("../analysisOrchestrationService");
const client_1 = require("@prisma/client");
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock("../ai/commentPreprocessor");
jest.mock("../ai/sentimentAnalyzer");
jest.mock("../ai/themeAnalyzer");
jest.mock("../ai/summaryGenerator");
describe("AnalysisOrchestrationService", () => {
    let orchestrationService;
    let prismaMock;
    let jobManagerMock;
    beforeEach(() => {
        prismaMock = (0, jest_mock_extended_1.mockDeep)();
        jobManagerMock = {
            updateJobProgress: jest.fn(),
            markJobFailed: jest.fn(),
        };
        orchestrationService = new analysisOrchestrationService_1.AnalysisOrchestrationService(prismaMock, jobManagerMock);
    });
    afterEach(() => {
        (0, jest_mock_extended_1.mockReset)(prismaMock);
        jest.clearAllMocks();
    });
    describe("processAnalysis", () => {
        const mockComments = [
            {
                id: "comment-1",
                text: "Great video!",
                authorName: "User1",
                publishedAt: new Date(),
                likeCount: 5,
                isFiltered: false,
            },
            {
                id: "comment-2",
                text: "Not bad, could be better",
                authorName: "User2",
                publishedAt: new Date(),
                likeCount: 2,
                isFiltered: false,
            },
        ];
        beforeEach(() => {
            prismaMock.analysisResult.findFirst.mockResolvedValue(null);
            prismaMock.comment.findMany.mockResolvedValue(mockComments);
            const mockPreprocessResult = {
                filteredComments: mockComments,
                spamComments: [],
                toxicComments: [],
                filterStats: { total: 2, spam: 0, toxic: 0, duplicate: 0, filtered: 2 },
            };
            const mockSentimentResult = {
                results: mockComments.map(() => ({ sentiment: "POSITIVE", confidence: 0.8, emotions: [] })),
                summary: {
                    totalAnalyzed: 2,
                    averageConfidence: 0.8,
                    sentimentDistribution: { positive: 0.8, negative: 0.1, neutral: 0.1 },
                },
            };
            const mockThemeResult = {
                themes: [{ name: "Positive Feedback", frequency: 2, sentiment: "POSITIVE", exampleComments: [] }],
                keywords: [{ word: "great", frequency: 1, sentiment: "POSITIVE", contexts: [] }],
                summary: { totalThemes: 1, totalKeywords: 1, averageCoherence: 0.8, dominantSentiment: "POSITIVE" },
            };
            const mockSummaryResult = {
                summary: "Great positive feedback from audience",
                emotions: [{ name: "joy", prevalence: 80, description: "Happy", representativeComments: [] }],
                keyInsights: ["Positive sentiment"],
                recommendations: ["Keep it up"],
                qualityScore: 0.9,
                wordCount: 6,
            };
            orchestrationService.commentPreprocessor.preprocessComments = jest.fn().mockResolvedValue(mockPreprocessResult);
            orchestrationService.sentimentAnalyzer.analyzeBatchSentiment = jest.fn().mockResolvedValue(mockSentimentResult);
            orchestrationService.themeAnalyzer.analyzeThemes = jest.fn().mockResolvedValue(mockThemeResult);
            orchestrationService.summaryGenerator.generateSummary = jest.fn().mockResolvedValue(mockSummaryResult);
            prismaMock.$transaction.mockImplementation(async (callback) => {
                const txMock = {
                    analysisResult: {
                        create: jest.fn().mockResolvedValue({ id: "result-123" }),
                    },
                    sentimentBreakdown: {
                        create: jest.fn(),
                    },
                    emotion: {
                        createMany: jest.fn(),
                    },
                    theme: {
                        createMany: jest.fn(),
                    },
                    keyword: {
                        createMany: jest.fn(),
                    },
                };
                return callback(txMock);
            });
        });
        it("should process analysis successfully", async () => {
            await orchestrationService.processAnalysis("job-123", "post-123", "user-123", ["comment-1", "comment-2"]);
            expect(jobManagerMock.updateJobProgress).toHaveBeenCalledTimes(6);
            expect(jobManagerMock.updateJobProgress).toHaveBeenLastCalledWith("job-123", { progress: 100, currentStep: 5, stepDescription: "Analysis completed" }, client_1.JobStatus.COMPLETED);
        });
        it("should use cached result if available", async () => {
            const cachedResult = {
                id: "cached-result-123",
                analyzedAt: new Date(Date.now() - 1000 * 60 * 30),
            };
            prismaMock.analysisResult.findFirst.mockResolvedValue(cachedResult);
            prismaMock.analysisResult.update.mockResolvedValue({});
            await orchestrationService.processAnalysis("job-123", "post-123", "user-123", ["comment-1"]);
            expect(prismaMock.analysisResult.update).toHaveBeenCalledWith({
                where: { id: "cached-result-123" },
                data: { jobId: "job-123" },
            });
            expect(jobManagerMock.updateJobProgress).toHaveBeenCalledWith("job-123", {
                progress: 100,
                currentStep: 5,
                stepDescription: "Used cached analysis result",
            }, client_1.JobStatus.COMPLETED);
        });
        it("should handle errors and mark job as failed", async () => {
            prismaMock.comment.findMany.mockRejectedValue(new Error("Database error"));
            await expect(orchestrationService.processAnalysis("job-123", "post-123", "user-123", ["comment-1"])).rejects.toThrow("Failed to fetch comments for analysis");
            expect(jobManagerMock.markJobFailed).toHaveBeenCalledWith("job-123", "Failed to fetch comments for analysis");
        });
        it("should throw error if no comments found", async () => {
            prismaMock.comment.findMany.mockResolvedValue([]);
            await expect(orchestrationService.processAnalysis("job-123", "post-123", "user-123", [])).rejects.toThrow("No comments found for analysis");
        });
    });
    describe("validateAnalysisPrerequisites", () => {
        it("should return valid for post with sufficient comments", async () => {
            const mockPost = {
                id: "post-123",
                userId: "user-123",
                comments: Array(10)
                    .fill(null)
                    .map((_, i) => ({
                    id: `comment-${i}`,
                    isFiltered: false,
                })),
            };
            const mockPlatforms = [{ id: "platform-1", platform: "YOUTUBE" }];
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue(mockPlatforms);
            const result = await orchestrationService.validateAnalysisPrerequisites("post-123", "user-123");
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it("should return invalid if post not found", async () => {
            prismaMock.post.findFirst.mockResolvedValue(null);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([]);
            const result = await orchestrationService.validateAnalysisPrerequisites("post-123", "user-123");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Post not found or access denied");
        });
        it("should return invalid if post has no comments", async () => {
            const mockPost = {
                id: "post-123",
                userId: "user-123",
                comments: [],
            };
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }]);
            const result = await orchestrationService.validateAnalysisPrerequisites("post-123", "user-123");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Post has no comments to analyze");
        });
        it("should return invalid if insufficient valid comments", async () => {
            const mockPost = {
                id: "post-123",
                userId: "user-123",
                comments: [
                    { id: "comment-1", isFiltered: false },
                    { id: "comment-2", isFiltered: true },
                    { id: "comment-3", isFiltered: false },
                ],
            };
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }]);
            const result = await orchestrationService.validateAnalysisPrerequisites("post-123", "user-123");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Post needs at least 5 valid comments for meaningful analysis");
        });
        it("should return invalid if no connected platforms", async () => {
            const mockPost = {
                id: "post-123",
                userId: "user-123",
                comments: Array(10)
                    .fill(null)
                    .map((_, i) => ({
                    id: `comment-${i}`,
                    isFiltered: false,
                })),
            };
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([]);
            const result = await orchestrationService.validateAnalysisPrerequisites("post-123", "user-123");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("User has no connected social media platforms");
        });
    });
    describe("estimateAnalysisTime", () => {
        it("should estimate time based on comment count", () => {
            expect(orchestrationService.estimateAnalysisTime(10)).toBe(11);
            expect(orchestrationService.estimateAnalysisTime(100)).toBe(20);
            expect(orchestrationService.estimateAnalysisTime(5000)).toBe(300);
        });
    });
    describe("getAnalysisPipelineStatus", () => {
        it("should return pipeline configuration", async () => {
            const status = await orchestrationService.getAnalysisPipelineStatus();
            expect(status.totalSteps).toBe(5);
            expect(status.steps).toHaveLength(5);
            expect(status.steps[0].name).toBe("preprocessing");
            expect(status.steps[1].name).toBe("sentiment");
            expect(status.steps[2].name).toBe("themes");
            expect(status.steps[3].name).toBe("summary");
            expect(status.steps[4].name).toBe("saving");
        });
    });
});
//# sourceMappingURL=analysisOrchestrationService.test.js.map