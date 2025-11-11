"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tokenManager_1 = require("../tokenManager");
const oauthService_1 = require("../oauthService");
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
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
const mockedOAuthService = oauthService_1.oauthService;
const mockPrisma = jest.mocked(prisma_1.default);
describe("TokenManager", () => {
    const mockUserId = "user-123";
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("getValidToken", () => {
        it("should return token if not expired", async () => {
            const mockConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "valid-token",
                refreshToken: "refresh-token",
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            mockedOAuthService.getConnection.mockResolvedValue(mockConnection);
            mockedOAuthService.isTokenExpired.mockReturnValue(false);
            const result = await tokenManager_1.tokenManager.getValidToken(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBe("valid-token");
            expect(mockedOAuthService.refreshToken).not.toHaveBeenCalled();
        });
        it("should refresh token if expired and return new token", async () => {
            const mockConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "old-token",
                refreshToken: "refresh-token",
                tokenExpiresAt: new Date(Date.now() - 3600 * 1000),
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
            const result = await tokenManager_1.tokenManager.getValidToken(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBe("new-token");
            expect(mockedOAuthService.refreshToken).toHaveBeenCalledWith(mockUserId, client_1.Platform.YOUTUBE);
        });
        it("should throw error if no connection exists", async () => {
            mockedOAuthService.getConnection.mockResolvedValue(null);
            await expect(tokenManager_1.tokenManager.getValidToken(mockUserId, client_1.Platform.YOUTUBE)).rejects.toThrow("No connection found for platform YOUTUBE");
        });
        it("should throw error if token refresh fails", async () => {
            const mockConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "old-token",
                refreshToken: "refresh-token",
                tokenExpiresAt: new Date(Date.now() - 3600 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            mockedOAuthService.getConnection.mockResolvedValue(mockConnection);
            mockedOAuthService.isTokenExpired.mockReturnValue(true);
            mockedOAuthService.refreshToken.mockRejectedValue(new Error("Refresh failed"));
            await expect(tokenManager_1.tokenManager.getValidToken(mockUserId, client_1.Platform.YOUTUBE)).rejects.toThrow("Token refresh failed for YOUTUBE. Please reconnect your account.");
        });
    });
    describe("validateAllTokens", () => {
        it("should validate all user tokens", async () => {
            const mockConnections = [
                { platform: client_1.Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() },
                { platform: client_1.Platform.INSTAGRAM, platformUserId: "instagram-123", connectedAt: new Date(), tokenExpiresAt: new Date() },
            ];
            mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
            mockedOAuthService.validateToken
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);
            const results = await tokenManager_1.tokenManager.validateAllTokens(mockUserId);
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({
                platform: client_1.Platform.YOUTUBE,
                isValid: true,
                needsReconnection: false,
            });
            expect(results[1]).toEqual({
                platform: client_1.Platform.INSTAGRAM,
                isValid: false,
                needsReconnection: true,
            });
        });
        it("should handle validation errors", async () => {
            const mockConnections = [{ platform: client_1.Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];
            mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
            mockedOAuthService.validateToken.mockRejectedValue(new Error("Validation error"));
            const results = await tokenManager_1.tokenManager.validateAllTokens(mockUserId);
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                platform: client_1.Platform.YOUTUBE,
                isValid: false,
                needsReconnection: true,
                error: "Validation error",
            });
        });
    });
    describe("refreshExpiringTokens", () => {
        it("should refresh tokens that are expiring soon", async () => {
            const mockConnections = [{ platform: client_1.Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];
            const mockFullConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "youtube-123",
                accessToken: "token",
                refreshToken: "refresh-token",
                tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
            mockedOAuthService.getConnection.mockResolvedValue(mockFullConnection);
            mockedOAuthService.isTokenExpired.mockReturnValue(true);
            mockedOAuthService.refreshToken.mockResolvedValue({
                accessToken: "new-token",
                refreshToken: "refresh-token",
                expiresAt: new Date(Date.now() + 3600 * 1000),
            });
            const results = await tokenManager_1.tokenManager.refreshExpiringTokens(mockUserId);
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                platform: client_1.Platform.YOUTUBE,
                refreshed: true,
            });
        });
        it("should not refresh tokens that are not expiring", async () => {
            const mockConnections = [{ platform: client_1.Platform.YOUTUBE, platformUserId: "youtube-123", connectedAt: new Date(), tokenExpiresAt: new Date() }];
            const mockFullConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "youtube-123",
                accessToken: "token",
                refreshToken: "refresh-token",
                tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
            mockedOAuthService.getConnection.mockResolvedValue(mockFullConnection);
            mockedOAuthService.isTokenExpired.mockReturnValue(false);
            const results = await tokenManager_1.tokenManager.refreshExpiringTokens(mockUserId);
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                platform: client_1.Platform.YOUTUBE,
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
                    platform: client_1.Platform.YOUTUBE,
                    platformUserId: "platform-123",
                    accessToken: "encrypted-token",
                    refreshToken: "encrypted-refresh",
                    tokenExpiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                    connectedAt: new Date(),
                },
            ];
            mockPrisma.connectedPlatform.findMany.mockResolvedValue(mockExpiredConnections);
            mockedOAuthService.validateToken.mockResolvedValue(false);
            mockedOAuthService.refreshToken.mockRejectedValue(new Error("Refresh failed"));
            mockPrisma.connectedPlatform.delete.mockResolvedValue({});
            const results = await tokenManager_1.tokenManager.cleanupExpiredTokens();
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
                    platform: client_1.Platform.YOUTUBE,
                    platformUserId: "platform-123",
                    accessToken: "encrypted-token",
                    refreshToken: "encrypted-refresh",
                    tokenExpiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                    connectedAt: new Date(),
                },
            ];
            mockPrisma.connectedPlatform.findMany.mockResolvedValue(mockExpiredConnections);
            mockedOAuthService.validateToken.mockResolvedValue(true);
            const results = await tokenManager_1.tokenManager.cleanupExpiredTokens();
            expect(results.deletedConnections).toBe(0);
            expect(mockPrisma.connectedPlatform.delete).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=tokenManager.test.js.map