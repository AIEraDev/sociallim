import { AnalysisServiceFactory } from "../analysisServiceFactory";
import { PrismaClient, JobStatus } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock the services
jest.mock("../jobManager");
jest.mock("../analysisOrchestrationService");

describe("AnalysisServiceFactory", () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let factory: AnalysisServiceFactory;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    factory = AnalysisServiceFactory.getInstance(prismaMock as any);
  });

  afterEach(() => {
    mockReset(prismaMock);
    // Reset singleton
    (AnalysisServiceFactory as any).instance = null;
  });

  describe("getInstance", () => {
    it("should create singleton instance", () => {
      const factory1 = AnalysisServiceFactory.getInstance(prismaMock as any);
      const factory2 = AnalysisServiceFactory.getInstance();

      expect(factory1).toBe(factory2);
    });

    it("should throw error if no prisma client provided on first call", () => {
      (AnalysisServiceFactory as any).instance = null;

      expect(() => AnalysisServiceFactory.getInstance()).toThrow("Prisma client is required for first initialization");
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

      // Mock orchestration service methods
      const mockOrchestrationService = factory.getOrchestrationService();
      (mockOrchestrationService.validateAnalysisPrerequisites as jest.Mock) = jest.fn();
      (mockOrchestrationService.estimateAnalysisTime as jest.Mock) = jest.fn().mockReturnValue(15);
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

      prismaMock.post.findFirst.mockResolvedValue(mockPost as any);
      prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }] as any);
      prismaMock.analysisResult.findFirst.mockResolvedValue(null); // No cached result
      prismaMock.comment.findMany.mockResolvedValue(mockComments as any);

      // Mock orchestration service validation
      const mockOrchestrationService = factory.getOrchestrationService();
      (mockOrchestrationService.validateAnalysisPrerequisites as jest.Mock).mockResolvedValue({
        valid: true,
        errors: [],
      });

      // Mock job manager
      const mockJobManager = factory.getJobManager();
      (mockJobManager.queueAnalysisJob as jest.Mock).mockResolvedValue("job-123");

      const result = await factory.startAnalysis("post-123", "user-123");

      expect(result.validation.valid).toBe(true);
      expect(result.jobId).toBe("job-123");
      expect(result.estimatedTime).toBeGreaterThan(0);
    });

    it("should return validation errors for invalid post", async () => {
      prismaMock.post.findFirst.mockResolvedValue(null);
      prismaMock.connectedPlatform.findMany.mockResolvedValue([]);

      // Mock orchestration service validation
      const mockOrchestrationService = factory.getOrchestrationService();
      (mockOrchestrationService.validateAnalysisPrerequisites as jest.Mock).mockResolvedValue({
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
        analyzedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      };

      prismaMock.post.findFirst.mockResolvedValue({
        id: "post-123",
        userId: "user-123",
        comments: [{ id: "comment-1", isFiltered: false }],
      } as any);
      prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }] as any);
      prismaMock.analysisResult.findFirst.mockResolvedValue(cachedResult as any);

      // Mock orchestration service validation
      const mockOrchestrationService = factory.getOrchestrationService();
      (mockOrchestrationService.validateAnalysisPrerequisites as jest.Mock).mockResolvedValue({
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

      prismaMock.post.findFirst.mockResolvedValue(mockPost as any);
      prismaMock.connectedPlatform.findMany.mockResolvedValue([{ platform: "YOUTUBE" }] as any);
      prismaMock.analysisResult.findFirst.mockResolvedValue(null);
      prismaMock.comment.findMany.mockResolvedValue(Array(5).fill({ id: "comment", isFiltered: false }));

      // Mock orchestration service validation
      const mockOrchestrationService = factory.getOrchestrationService();
      (mockOrchestrationService.validateAnalysisPrerequisites as jest.Mock).mockResolvedValue({
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

      prismaMock.analysisResult.findFirst.mockResolvedValue(mockResult as any);

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
      // Mock database counts
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.post.count.mockResolvedValue(500);
      prismaMock.comment.count.mockResolvedValue(5000);
      prismaMock.analysisResult.count.mockResolvedValueOnce(200); // Total analyses
      prismaMock.analysisResult.count.mockResolvedValueOnce(10); // Recent analyses

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
      // Mock job manager cleanup
      const mockJobManager = factory.getJobManager();
      (mockJobManager.cleanupJobs as jest.Mock).mockResolvedValue(undefined);

      // Mock database cleanup
      prismaMock.analysisResult.deleteMany.mockResolvedValue({ count: 5 });

      const result = await factory.performMaintenance();

      expect(result.jobsCleanedUp).toBe(true);
      expect(result.cacheCleared).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle maintenance errors gracefully", async () => {
      // Mock job manager cleanup failure
      const mockJobManager = factory.getJobManager();
      (mockJobManager.cleanupJobs as jest.Mock).mockRejectedValue(new Error("Cleanup failed"));

      // Mock database cleanup failure
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
