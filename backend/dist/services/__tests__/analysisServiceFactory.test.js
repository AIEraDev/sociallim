"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysisServiceFactory_1 = require("../analysisServiceFactory");
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock("../jobManager");
jest.mock("../analysisOrchestrationService");
describe("AnalysisServiceFactory", () => {
    let prismaMock;
    let factory;
    beforeEach(() => {
        prismaMock = (0, jest_mock_extended_1.mockDeep)();
        factory = analysisServiceFactory_1.AnalysisServiceFactory.getInstance(prismaMock);
    });
    afterEach(() => {
        (0, jest_mock_extended_1.mockReset)(prismaMock);
        analysisServiceFactory_1.AnalysisServiceFactory.instance = null;
    });
    describe("getInstance", () => {
        it("should create singleton instance", () => {
            const factory1 = analysisServiceFactory_1.AnalysisServiceFactory.getInstance(prismaMock);
            const factory2 = analysisServiceFactory_1.AnalysisServiceFactory.getInstance();
            expect(factory1).toBe(factory2);
        });
        it("should throw error if no prisma client provided on first call", () => {
            analysisServiceFactory_1.AnalysisServiceFactory.instance = null;
            expect(() => analysisServiceFactory_1.AnalysisServiceFactory.getInstance()).toThrow("Prisma client is required for first initialization");
        });
    });
    describe("initialize", () => {
        it("should initialize all services successfully", async () => {
            await expect(factory.initialize()).resolves.not.toThrow();
        });
    });
    describe("startAnalysis", () => {
        beforeEach(async () => {
            await factory.initialize();
            const mockOrchestrationService = factory.getOrchestrationService();
            mockOrchestrationService.validateAnalysisPrerequisites = jest.fn();
            mockOrchestrationService.estimateAnalysisTime = jest.fn().mockReturnValue(15);
        });
        it("should start analysis with validation", async () => {
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
            const mockComments = Array(10)
                .fill(null)
                .map((_, i) => ({
                id: `comment-${i}`,
                text: `Comment ${i}`,
                isFiltered: false,
            }));
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }]);
            prismaMock.analysisResult.findFirst.mockResolvedValue(null);
            prismaMock.comment.findMany.mockResolvedValue(mockComments);
            const mockOrchestrationService = factory.getOrchestrationService();
            mockOrchestrationService.validateAnalysisPrerequisites.mockResolvedValue({
                valid: true,
                errors: [],
            });
            const mockJobManager = factory.getJobManager();
            mockJobManager.queueAnalysisJob.mockResolvedValue("job-123");
            const result = await factory.startAnalysis("post-123", "user-123");
            expect(result.validation.valid).toBe(true);
            expect(result.jobId).toBe("job-123");
            expect(result.estimatedTime).toBeGreaterThan(0);
        });
        it("should return validation errors for invalid post", async () => {
            prismaMock.post.findFirst.mockResolvedValue(null);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([]);
            const mockOrchestrationService = factory.getOrchestrationService();
            mockOrchestrationService.validateAnalysisPrerequisites.mockResolvedValue({
                valid: false,
                errors: ["Post not found or access denied"],
            });
            const result = await factory.startAnalysis("post-123", "user-123");
            expect(result.validation.valid).toBe(false);
            expect(result.validation.errors).toContain("Post not found or access denied");
            expect(result.jobId).toBeUndefined();
        });
        it("should return cached result if available", async () => {
            const cachedResult = {
                id: "cached-123",
                analyzedAt: new Date(Date.now() - 1000 * 60 * 30),
            };
            prismaMock.post.findFirst.mockResolvedValue({
                id: "post-123",
                userId: "user-123",
                comments: [{ id: "comment-1", isFiltered: false }],
            });
            prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }]);
            prismaMock.analysisResult.findFirst.mockResolvedValue(cachedResult);
            const mockOrchestrationService = factory.getOrchestrationService();
            mockOrchestrationService.validateAnalysisPrerequisites.mockResolvedValue({
                valid: true,
                errors: [],
            });
            const result = await factory.startAnalysis("post-123", "user-123");
            expect(result.validation.valid).toBe(true);
            expect(result.cached).toBe(true);
            expect(result.jobId).toBeUndefined();
        });
        it("should return estimate only when requested", async () => {
            const mockPost = {
                id: "post-123",
                userId: "user-123",
                comments: Array(5)
                    .fill(null)
                    .map((_, i) => ({
                    id: `comment-${i}`,
                    isFiltered: false,
                })),
            };
            prismaMock.post.findFirst.mockResolvedValue(mockPost);
            prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }]);
            prismaMock.analysisResult.findFirst.mockResolvedValue(null);
            prismaMock.comment.findMany.mockResolvedValue(Array(5).fill({ id: "comment", isFiltered: false }));
            const mockOrchestrationService = factory.getOrchestrationService();
            mockOrchestrationService.validateAnalysisPrerequisites.mockResolvedValue({
                valid: true,
                errors: [],
            });
            const result = await factory.startAnalysis("post-123", "user-123", { estimateOnly: true });
            expect(result.validation.valid).toBe(true);
            expect(result.estimatedTime).toBeGreaterThan(0);
            expect(result.jobId).toBeUndefined();
        });
    });
    describe("getAnalysisResults", () => {
        beforeEach(async () => {
            await factory.initialize();
        });
        it("should return analysis results", async () => {
            const mockResult = {
                id: "result-123",
                summary: "Test summary",
                totalComments: 10,
                filteredComments: 2,
                analyzedAt: new Date(),
                post: { title: "Test Post", platform: "YOUTUBE", publishedAt: new Date() },
                sentimentBreakdown: { positive: 0.7, negative: 0.2, neutral: 0.1 },
                emotions: [{ name: "joy", percentage: 70 }],
                themes: [{ name: "Positive Feedback", frequency: 5 }],
                keywords: [{ word: "great", frequency: 3 }],
            };
            prismaMock.analysisResult.findFirst.mockResolvedValue(mockResult);
            const result = await factory.getAnalysisResults("job-123");
            expect(result.id).toBe("result-123");
            expect(result.summary).toBe("Test summary");
            expect(result.totalComments).toBe(10);
        });
        it("should throw error if results not found", async () => {
            prismaMock.analysisResult.findFirst.mockResolvedValue(null);
            await expect(factory.getAnalysisResults("job-123")).rejects.toThrow("Analysis results not found");
        });
    });
    describe("getSystemStats", () => {
        beforeEach(async () => {
            await factory.initialize();
        });
        it("should return system statistics", async () => {
            prismaMock.user.count.mockResolvedValue(100);
            prismaMock.post.count.mockResolvedValue(500);
            prismaMock.comment.count.mockResolvedValue(5000);
            prismaMock.analysisResult.count.mockResolvedValueOnce(200);
            prismaMock.analysisResult.count.mockResolvedValueOnce(10);
            const stats = await factory.getSystemStats();
            expect(stats.database.totalUsers).toBe(100);
            expect(stats.database.totalPosts).toBe(500);
            expect(stats.database.totalComments).toBe(5000);
            expect(stats.database.totalAnalyses).toBe(200);
            expect(stats.database.recentAnalyses).toBe(10);
            expect(stats.uptime).toBeGreaterThan(0);
            expect(stats.memory).toBeDefined();
        });
    });
    describe("performMaintenance", () => {
        beforeEach(async () => {
            await factory.initialize();
        });
        it("should perform maintenance tasks successfully", async () => {
            const mockJobManager = factory.getJobManager();
            mockJobManager.cleanupJobs.mockResolvedValue(undefined);
            prismaMock.analysisResult.deleteMany.mockResolvedValue({ count: 5 });
            const result = await factory.performMaintenance();
            expect(result.jobsCleanedUp).toBe(true);
            expect(result.cacheCleared).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it("should handle maintenance errors gracefully", async () => {
            const mockJobManager = factory.getJobManager();
            mockJobManager.cleanupJobs.mockRejectedValue(new Error("Cleanup failed"));
            prismaMock.analysisResult.deleteMany.mockRejectedValue(new Error("DB cleanup failed"));
            const result = await factory.performMaintenance();
            expect(result.jobsCleanedUp).toBe(false);
            expect(result.cacheCleared).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0]).toContain("Job cleanup failed");
            expect(result.errors[1]).toContain("Cache cleanup failed");
        });
    });
    describe("configuration", () => {
        it("should update configuration", () => {
            const newConfig = {
                redisConfig: { host: "localhost", port: 6379 },
                jobConfig: { batchSize: 20, maxRetries: 5 },
            };
            factory.updateConfig(newConfig);
            const config = factory.getConfig();
            expect(config.redisConfig).toEqual(newConfig.redisConfig);
            expect(config.jobConfig).toEqual(newConfig.jobConfig);
        });
    });
});
//# sourceMappingURL=analysisServiceFactory.test.js.map