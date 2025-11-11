import { JobManager } from "../jobManager";
import { PrismaClient, JobStatus } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock Bull queue
jest.mock("bull", () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "bull-job-id" }),
    process: jest.fn(),
    on: jest.fn(),
    getJob: jest.fn(),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    clean: jest.fn().mockResolvedValue(0),
    close: jest.fn().mockResolvedValue(undefined),
  }));
});

describe("JobManager", () => {
  let jobManager: JobManager;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    jobManager = new JobManager(prismaMock as any);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  describe("queueAnalysisJob", () => {
    it("should create job in database and queue it", async () => {
      const mockJob = {
        id: "job-123",
        postId: "post-123",
        userId: "user-123",
        status: JobStatus.PENDING,
        totalSteps: 5,
        currentStep: 0,
        progress: 0,
      };

      prismaMock.analysisJob.create.mockResolvedValue(mockJob as any);

      const jobId = await jobManager.queueAnalysisJob("post-123", "user-123", ["comment-1", "comment-2"]);

      expect(jobId).toBe("job-123");
      expect(prismaMock.analysisJob.create).toHaveBeenCalledWith({
        data: {
          postId: "post-123",
          userId: "user-123",
          status: JobStatus.PENDING,
          totalSteps: 5,
          currentStep: 0,
          progress: 0,
        },
      });
    });

    it("should throw error if database operation fails", async () => {
      prismaMock.analysisJob.create.mockRejectedValue(new Error("Database error"));

      await expect(jobManager.queueAnalysisJob("post-123", "user-123", ["comment-1"])).rejects.toThrow("Failed to queue analysis job");
    });
  });

  describe("getJobStatus", () => {
    it("should return job status with related data", async () => {
      const mockJob = {
        id: "job-123",
        status: JobStatus.RUNNING,
        progress: 50,
        totalSteps: 5,
        currentStep: 2,
        stepDescription: "Analyzing sentiment",
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        post: {
          title: "Test Post",
          platform: "YOUTUBE",
        },
        analysisResult: null,
      };

      prismaMock.analysisJob.findUnique.mockResolvedValue(mockJob as any);

      const status = await jobManager.getJobStatus("job-123");

      expect(status).toEqual({
        id: "job-123",
        status: JobStatus.RUNNING,
        progress: 50,
        totalSteps: 5,
        currentStep: 2,
        stepDescription: "Analyzing sentiment",
        errorMessage: null,
        retryCount: 0,
        createdAt: mockJob.createdAt,
        startedAt: mockJob.startedAt,
        completedAt: null,
        post: mockJob.post,
        hasResult: false,
      });
    });

    it("should throw error if job not found", async () => {
      prismaMock.analysisJob.findUnique.mockResolvedValue(null);

      await expect(jobManager.getJobStatus("nonexistent")).rejects.toThrow("Job not found");
    });
  });

  describe("updateJobProgress", () => {
    it("should update job progress in database", async () => {
      prismaMock.analysisJob.update.mockResolvedValue({} as any);

      await jobManager.updateJobProgress(
        "job-123",
        {
          progress: 75,
          currentStep: 3,
          stepDescription: "Extracting themes",
        },
        JobStatus.RUNNING
      );

      expect(prismaMock.analysisJob.update).toHaveBeenCalledWith({
        where: { id: "job-123" },
        data: {
          progress: 75,
          currentStep: 3,
          stepDescription: "Extracting themes",
          status: JobStatus.RUNNING,
          startedAt: expect.any(Date),
        },
      });
    });

    it("should set completedAt when job is completed", async () => {
      prismaMock.analysisJob.update.mockResolvedValue({} as any);

      await jobManager.updateJobProgress(
        "job-123",
        {
          progress: 100,
        },
        JobStatus.COMPLETED
      );

      expect(prismaMock.analysisJob.update).toHaveBeenCalledWith({
        where: { id: "job-123" },
        data: {
          progress: 100,
          status: JobStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe("markJobFailed", () => {
    it("should mark job as failed with error message", async () => {
      prismaMock.analysisJob.update.mockResolvedValue({} as any);

      await jobManager.markJobFailed("job-123", "Analysis failed");

      expect(prismaMock.analysisJob.update).toHaveBeenCalledWith({
        where: { id: "job-123" },
        data: {
          status: JobStatus.FAILED,
          errorMessage: "Analysis failed",
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe("getUserJobs", () => {
    it("should return user job history", async () => {
      const mockJobs = [
        {
          id: "job-1",
          status: JobStatus.COMPLETED,
          progress: 100,
          createdAt: new Date(),
          completedAt: new Date(),
          post: { title: "Post 1", platform: "YOUTUBE" },
          analysisResult: { id: "result-1" },
          errorMessage: null,
        },
        {
          id: "job-2",
          status: JobStatus.FAILED,
          progress: 50,
          createdAt: new Date(),
          completedAt: new Date(),
          post: { title: "Post 2", platform: "INSTAGRAM" },
          analysisResult: null,
          errorMessage: "Processing failed",
        },
      ];

      prismaMock.analysisJob.findMany.mockResolvedValue(mockJobs as any);

      const jobs = await jobManager.getUserJobs("user-123");

      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toEqual({
        id: "job-1",
        status: JobStatus.COMPLETED,
        progress: 100,
        createdAt: mockJobs[0].createdAt,
        completedAt: mockJobs[0].completedAt,
        post: mockJobs[0].post,
        hasResult: true,
        errorMessage: null,
      });
      expect(jobs[1]).toEqual({
        id: "job-2",
        status: JobStatus.FAILED,
        progress: 50,
        createdAt: mockJobs[1].createdAt,
        completedAt: mockJobs[1].completedAt,
        post: mockJobs[1].post,
        hasResult: false,
        errorMessage: "Processing failed",
      });
    });
  });

  describe("retryJob", () => {
    it("should retry a failed job", async () => {
      const mockJob = {
        id: "job-123",
        status: JobStatus.FAILED,
        retryCount: 1,
        maxRetries: 3,
        postId: "post-123",
        userId: "user-123",
        post: {
          comments: [{ id: "comment-1" }, { id: "comment-2" }],
        },
      };

      prismaMock.analysisJob.findUnique.mockResolvedValue(mockJob as any);
      prismaMock.analysisJob.update.mockResolvedValue({} as any);

      await jobManager.retryJob("job-123");

      expect(prismaMock.analysisJob.update).toHaveBeenCalledWith({
        where: { id: "job-123" },
        data: {
          status: JobStatus.PENDING,
          progress: 0,
          currentStep: 0,
          stepDescription: null,
          errorMessage: null,
          retryCount: 2,
          startedAt: null,
          completedAt: null,
        },
      });
    });

    it("should throw error if job not found", async () => {
      prismaMock.analysisJob.findUnique.mockResolvedValue(null);

      await expect(jobManager.retryJob("nonexistent")).rejects.toThrow("Job not found");
    });

    it("should throw error if job is not failed", async () => {
      const mockJob = {
        id: "job-123",
        status: JobStatus.RUNNING,
      };

      prismaMock.analysisJob.findUnique.mockResolvedValue(mockJob as any);

      await expect(jobManager.retryJob("job-123")).rejects.toThrow("Only failed jobs can be retried");
    });

    it("should throw error if max retries exceeded", async () => {
      const mockJob = {
        id: "job-123",
        status: JobStatus.FAILED,
        retryCount: 3,
        maxRetries: 3,
      };

      prismaMock.analysisJob.findUnique.mockResolvedValue(mockJob as any);

      await expect(jobManager.retryJob("job-123")).rejects.toThrow("Maximum retry attempts exceeded");
    });
  });

  describe("cancelJob", () => {
    it("should cancel a job and update database", async () => {
      prismaMock.analysisJob.update.mockResolvedValue({} as any);

      await jobManager.cancelJob("job-123");

      expect(prismaMock.analysisJob.update).toHaveBeenCalledWith({
        where: { id: "job-123" },
        data: { status: JobStatus.CANCELLED },
      });
    });
  });
});
