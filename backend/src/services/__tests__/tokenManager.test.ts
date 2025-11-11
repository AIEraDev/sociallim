import { tokenManager } from "../tokenManager";
import { oauthService } from "../oauthService";
import { Platform } from "@prisma/client";
import prisma from "../../config/prisma";

// Mock dependencies
jest.mock("../oauthService");

jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    connectedPlatform: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockedOAuthService = oauthService as jest.Mocked<typeof oauthService>;

// Get the mocked prisma instance
const mockPrisma = jest.mocked(prisma);

describe("TokenManager", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getValidToken", () => {
    it("should return token if not expired", async () => {
      const mockConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        connectedAt: new Date(),
        userId: mockUserId,
      };

      mockedOAuthService.getConnection.mockResolvedValue(mockConnection);
      mockedOAuthService.isTokenExpired.mockReturnValue(false);

      const result = await tokenManager.getValidToken(mockUserId, Platform.YOUTUBE);

      expect(result).toBe("valid-token");
      expect(mockedOAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it("should refresh token if expired and return new token", async () => {
      const mockConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "old-token",
        refreshToken: "refresh-token",
        tokenExpiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        connectedAt: new Date(),
        userId: mockUserId,
      };

      const refreshedConnection = {
        ...mockConnection,
        accessToken: "new-token",
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      };

      mockedOAuthService.getConnection.mockResolvedValueOnce(mockConnection).mockResolvedValueOnce(refreshedConnection);
      mockedOAuthService.isTokenExpired.mockReturnValue(true);
      mockedOAuthService.refreshToken.mockResolvedValue({
        accessToken: "new-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      const result = await tokenManager.getValidToken(mockUserId, Platform.YOUTUBE);

      expect(result).toBe("new-token");
      expect(mockedOAuthService.refreshToken).toHaveBeenCalledWith(mockUserId, Platform.YOUTUBE);
    });

    it("should throw error if no connection exists", async () => {
      mockedOAuthService.getConnection.mockResolvedValue(null);

      await expect(tokenManager.getValidToken(mockUserId, Platform.YOUTUBE)).rejects.toThrow("No connection found for platform YOUTUBE");
    });

    it("should throw error if token refresh fails", async () => {
      const mockConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "platform-user-123",
        accessToken: "old-token",
        refreshToken: "refresh-token",
        tokenExpiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        connectedAt: new Date(),
        userId: mockUserId,
      };

      mockedOAuthService.getConnection.mockResolvedValue(mockConnection);
      mockedOAuthService.isTokenExpired.mockReturnValue(true);
      mockedOAuthService.refreshToken.mockRejectedValue(new Error("Refresh failed"));

      await expect(tokenManager.getValidToken(mockUserId, Platform.YOUTUBE)).rejects.toThrow("Token refresh failed for YOUTUBE. Please reconnect your account.");
    });
  });

  describe("validateAllTokens", () => {
    it("should validate all user tokens", async () => {
      const mockConnections = [
        { platform: Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() },
        { platform: Platform.INSTAGRAM, platformUserId: "instagram-123", connectedAt: new Date(), tokenExpiresAt: new Date() },
      ];

      mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
      mockedOAuthService.validateToken
        .mockResolvedValueOnce(true) // YouTube valid
        .mockResolvedValueOnce(false); // Instagram invalid

      const results = await tokenManager.validateAllTokens(mockUserId);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        platform: Platform.YOUTUBE,
        isValid: true,
        needsReconnection: false,
      });
      expect(results[1]).toEqual({
        platform: Platform.INSTAGRAM,
        isValid: false,
        needsReconnection: true,
      });
    });

    it("should handle validation errors", async () => {
      const mockConnections = [{ platform: Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];

      mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
      mockedOAuthService.validateToken.mockRejectedValue(new Error("Validation error"));

      const results = await tokenManager.validateAllTokens(mockUserId);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        platform: Platform.YOUTUBE,
        isValid: false,
        needsReconnection: true,
        error: "Validation error",
      });
    });
  });

  describe("refreshExpiringTokens", () => {
    it("should refresh tokens that are expiring soon", async () => {
      const mockConnections = [{ platform: Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];

      const mockFullConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "youtube-123",
        accessToken: "token",
        refreshToken: "refresh-token",
        tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        connectedAt: new Date(),
        userId: mockUserId,
      };

      mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
      mockedOAuthService.getConnection.mockResolvedValue(mockFullConnection);
      mockedOAuthService.isTokenExpired.mockReturnValue(true); // Will expire in 24 hours
      mockedOAuthService.refreshToken.mockResolvedValue({
        accessToken: "new-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      const results = await tokenManager.refreshExpiringTokens(mockUserId);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        platform: Platform.YOUTUBE,
        refreshed: true,
      });
    });

    it("should not refresh tokens that are not expiring", async () => {
      const mockConnections = [{ platform: Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];

      const mockFullConnection = {
        id: "conn-123",
        platform: Platform.YOUTUBE,
        platformUserId: "youtube-123",
        accessToken: "token",
        refreshToken: "refresh-token",
        tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        connectedAt: new Date(),
        userId: mockUserId,
      };

      mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
      mockedOAuthService.getConnection.mockResolvedValue(mockFullConnection);
      mockedOAuthService.isTokenExpired.mockReturnValue(false); // Not expiring in 24 hours

      const results = await tokenManager.refreshExpiringTokens(mockUserId);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        platform: Platform.YOUTUBE,
        refreshed: false,
      });
      expect(mockedOAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should delete connections with expired tokens that cannot be refreshed", async () => {
      const mockExpiredConnections = [
        {
          id: "conn-123",
          userId: mockUserId,
          platform: Platform.YOUTUBE,
          platformUserId: "platform-123",
          accessToken: "encrypted-token",
          refreshToken: "encrypted-refresh",
          tokenExpiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          connectedAt: new Date(),
        },
      ];

      mockPrisma.connectedPlatform.findMany.mockResolvedValue(mockExpiredConnections);
      mockedOAuthService.validateToken.mockResolvedValue(false);
      mockedOAuthService.refreshToken.mockRejectedValue(new Error("Refresh failed"));
      mockPrisma.connectedPlatform.delete.mockResolvedValue({} as any);

      const results = await tokenManager.cleanupExpiredTokens();

      expect(results.deletedConnections).toBe(1);
      expect(results.errors).toHaveLength(0);
      expect(mockPrisma.connectedPlatform.delete).toHaveBeenCalledWith({
        where: { id: "conn-123" },
      });
    });

    it("should not delete connections with valid tokens", async () => {
      const mockExpiredConnections = [
        {
          id: "conn-123",
          userId: mockUserId,
          platform: Platform.YOUTUBE,
          platformUserId: "platform-123",
          accessToken: "encrypted-token",
          refreshToken: "encrypted-refresh",
          tokenExpiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          connectedAt: new Date(),
        },
      ];

      mockPrisma.connectedPlatform.findMany.mockResolvedValue(mockExpiredConnections);
      mockedOAuthService.validateToken.mockResolvedValue(true);

      const results = await tokenManager.cleanupExpiredTokens();

      expect(results.deletedConnections).toBe(0);
      expect(mockPrisma.connectedPlatform.delete).not.toHaveBeenCalled();
    });
  });
});
