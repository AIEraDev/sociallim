import { DatabaseUtils } from "../database";
import { logger } from "../logger";

// Mock prisma config
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    connectedPlatform: {
      count: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
    analysisResult: {
      count: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Import the mocked prisma
const mockPrisma = require("../../config/prisma").default;

describe("DatabaseUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkConnection", () => {
    it("should return true when database connection is healthy", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

      const result = await DatabaseUtils.checkConnection();

      expect(result).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it("should return false when database connection fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection failed"));

      const result = await DatabaseUtils.checkConnection();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Database connection check failed:", expect.any(Error));
    });
  });

  describe("getStats", () => {
    it("should return database statistics", async () => {
      const mockCounts = {
        users: 10,
        platforms: 5,
        posts: 25,
        comments: 150,
        analysis: 8,
      };

      mockPrisma.user.count.mockResolvedValue(mockCounts.users);
      mockPrisma.connectedPlatform.count.mockResolvedValue(mockCounts.platforms);
      mockPrisma.post.count.mockResolvedValue(mockCounts.posts);
      mockPrisma.comment.count.mockResolvedValue(mockCounts.comments);
      mockPrisma.analysisResult.count.mockResolvedValue(mockCounts.analysis);

      const stats = await DatabaseUtils.getStats();

      expect(stats).toEqual({
        users: mockCounts.users,
        connectedPlatforms: mockCounts.platforms,
        posts: mockCounts.posts,
        comments: mockCounts.comments,
        analysisResults: mockCounts.analysis,
      });
    });

    it("should throw error when database query fails", async () => {
      mockPrisma.user.count.mockRejectedValue(new Error("Database error"));

      await expect(DatabaseUtils.getStats()).rejects.toThrow("Database error");
      expect(logger.error).toHaveBeenCalledWith("Failed to get database stats:", expect.any(Error));
    });
  });

  describe("cleanupOldAnalysis", () => {
    it("should delete old analysis results", async () => {
      const mockResult = { count: 5 };
      mockPrisma.analysisResult.deleteMany.mockResolvedValue(mockResult);

      const deletedCount = await DatabaseUtils.cleanupOldAnalysis(90);

      expect(deletedCount).toBe(5);
      expect(mockPrisma.analysisResult.deleteMany).toHaveBeenCalledWith({
        where: {
          analyzedAt: {
            lt: expect.any(Date),
          },
        },
      });
      expect(logger.info).toHaveBeenCalledWith("Cleaned up 5 old analysis results");
    });
  });

  describe("getUserWithPlatforms", () => {
    it("should return user with connected platforms", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        connectedPlatforms: [{ id: "1", platform: "YOUTUBE", userId: "1" }],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await DatabaseUtils.getUserWithPlatforms("1");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          connectedPlatforms: true,
        },
      });
    });
  });

  describe("disconnect", () => {
    it("should disconnect from database successfully", async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      await DatabaseUtils.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("Database connection closed");
    });

    it("should handle disconnect errors gracefully", async () => {
      mockPrisma.$disconnect.mockRejectedValue(new Error("Disconnect failed"));

      await DatabaseUtils.disconnect();

      expect(logger.error).toHaveBeenCalledWith("Error disconnecting from database:", expect.any(Error));
    });
  });
});
