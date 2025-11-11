import { oauthService, OAuthTokenData } from "../oauthService";
import prisma from "../../config/prisma";
import { Platform } from "@prisma/client";
import axios from "axios";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    connectedPlatform: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../utils/encryption", () => ({
  encrypt: jest.fn((text: string) => `encrypted_${text}`),
  decrypt: jest.fn((text: string) => text.replace("encrypted_", "")),
}));

describe("OAuthService", () => {
  const mockUserId = "user-123";
  const mockTokenData: OAuthTokenData = {
    platform: Platform.YOUTUBE,
    platformUserId: "platform-user-123",
    accessToken: "access-token-123",
    refreshToken: "refresh-token-123",
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("storeConnection", () => {
    it("should store OAuth connection successfully", async () => {
      (prisma.connectedPlatform.upsert as jest.Mock).mockResolvedValue({});

      await oauthService.storeConnection(mockUserId, mockTokenData);

      expect(prisma.connectedPlatform.upsert).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId: mockUserId,
            platform: Platform.YOUTUBE,
          },
        },
        update: {
          platformUserId: "platform-user-123",
          accessToken: "access-token-123",
          refreshToken: "refresh-token-123",
          tokenExpiresAt: mockTokenData.tokenExpiresAt,
        },
        create: {
          userId: mockUserId,
          platform: Platform.YOUTUBE,
          platformUserId: "platform-user-123",
          accessToken: "access-token-123",
          refreshToken: "refresh-token-123",
          tokenExpiresAt: mockTokenData.tokenExpiresAt,
        },
      });
    });

    it("should handle database errors", async () => {
      (prisma.connectedPlatform.upsert as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(oauthService.storeConnection(mockUserId, mockTokenData)).rejects.toThrow("Failed to store OAuth connection");
    });
  });

  describe("getConnection", () => {
    it("should retrieve and decrypt connection", async () => {
      const mockConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "encrypted_access-token-123",
        refreshToken: "encrypted_refresh-token-123",
        tokenExpiresAt: new Date(),
        connectedAt: new Date(),
        userId: mockUserId,
      };

      (prisma.connectedPlatform.findUnique as jest.Mock).mockResolvedValue(mockConnection);

      const result = await oauthService.getConnection(mockUserId, Platform.YOUTUBE);

      expect(result).toEqual({
        ...mockConnection,
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
      });
    });

    it("should return null if connection not found", async () => {
      (prisma.connectedPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await oauthService.getConnection(mockUserId, Platform.YOUTUBE);

      expect(result).toBeNull();
    });
  });

  describe("getUserConnections", () => {
    it("should retrieve all user connections", async () => {
      const mockConnections = [
        {
          platform: Platform.YOUTUBE,
          platformUserId: "youtube-123",
          connectedAt: new Date(),
          tokenExpiresAt: new Date(),
        },
        {
          platform: Platform.INSTAGRAM,
          platformUserId: "instagram-123",
          connectedAt: new Date(),
          tokenExpiresAt: new Date(),
        },
      ];

      (prisma.connectedPlatform.findMany as jest.Mock).mockResolvedValue(mockConnections);

      const result = await oauthService.getUserConnections(mockUserId);

      expect(result).toEqual(mockConnections);
      expect(prisma.connectedPlatform.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: {
          platform: true,
          platformUserId: true,
          connectedAt: true,
          tokenExpiresAt: true,
        },
      });
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for null expiration date", () => {
      const result = oauthService.isTokenExpired(null);
      expect(result).toBe(false);
    });

    it("should return true for expired token", () => {
      const expiredDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      const result = oauthService.isTokenExpired(expiredDate);
      expect(result).toBe(true);
    });

    it("should return false for valid token", () => {
      const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      const result = oauthService.isTokenExpired(futureDate);
      expect(result).toBe(false);
    });

    it("should consider buffer time", () => {
      const nearExpiryDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      const result = oauthService.isTokenExpired(nearExpiryDate, 30); // 30 minute buffer
      expect(result).toBe(true);
    });
  });

  describe("validateToken", () => {
    beforeEach(() => {
      const mockConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "encrypted_access-token-123",
        refreshToken: "encrypted_refresh-token-123",
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        connectedAt: new Date(),
        userId: mockUserId,
      };

      (prisma.connectedPlatform.findUnique as jest.Mock).mockResolvedValue(mockConnection);
    });

    it("should validate YouTube token successfully", async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await oauthService.validateToken(mockUserId, Platform.YOUTUBE);

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.googleapis.com/youtube/v3/channels", {
        params: { part: "id", mine: true },
        headers: { Authorization: "Bearer access-token-123" },
      });
    });

    it("should return false for invalid token", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Unauthorized"));

      const result = await oauthService.validateToken(mockUserId, Platform.YOUTUBE);

      expect(result).toBe(false);
    });

    it("should return false for expired token", async () => {
      const expiredConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "encrypted_access-token-123",
        refreshToken: "encrypted_refresh-token-123",
        tokenExpiresAt: new Date(Date.now() - 3600 * 1000), // Expired
        connectedAt: new Date(),
        userId: mockUserId,
      };

      (prisma.connectedPlatform.findUnique as jest.Mock).mockResolvedValue(expiredConnection);

      const result = await oauthService.validateToken(mockUserId, Platform.YOUTUBE);

      expect(result).toBe(false);
    });
  });

  describe("disconnectPlatform", () => {
    it("should disconnect platform successfully", async () => {
      (prisma.connectedPlatform.delete as jest.Mock).mockResolvedValue({});

      await oauthService.disconnectPlatform(mockUserId, Platform.YOUTUBE);

      expect(prisma.connectedPlatform.delete).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId: mockUserId,
            platform: Platform.YOUTUBE,
          },
        },
      });
    });

    it("should handle deletion errors", async () => {
      (prisma.connectedPlatform.delete as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(oauthService.disconnectPlatform(mockUserId, Platform.YOUTUBE)).rejects.toThrow("Failed to disconnect platform");
    });
  });
});
