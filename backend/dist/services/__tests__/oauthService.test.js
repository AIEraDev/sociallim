"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oauthService_1 = require("../oauthService");
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
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
const mockedAxios = axios_1.default;
jest.mock("../../utils/encryption", () => ({
    encrypt: jest.fn((text) => `encrypted_${text}`),
    decrypt: jest.fn((text) => text.replace("encrypted_", "")),
}));
describe("OAuthService", () => {
    const mockUserId = "user-123";
    const mockTokenData = {
        platform: client_1.Platform.YOUTUBE,
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
            prisma_1.default.connectedPlatform.upsert.mockResolvedValue({});
            await oauthService_1.oauthService.storeConnection(mockUserId, mockTokenData);
            expect(prisma_1.default.connectedPlatform.upsert).toHaveBeenCalledWith({
                where: {
                    userId_platform: {
                        userId: mockUserId,
                        platform: client_1.Platform.YOUTUBE,
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
                    platform: client_1.Platform.YOUTUBE,
                    platformUserId: "platform-user-123",
                    accessToken: "access-token-123",
                    refreshToken: "refresh-token-123",
                    tokenExpiresAt: mockTokenData.tokenExpiresAt,
                },
            });
        });
        it("should handle database errors", async () => {
            prisma_1.default.connectedPlatform.upsert.mockRejectedValue(new Error("Database error"));
            await expect(oauthService_1.oauthService.storeConnection(mockUserId, mockTokenData)).rejects.toThrow("Failed to store OAuth connection");
        });
    });
    describe("getConnection", () => {
        it("should retrieve and decrypt connection", async () => {
            const mockConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "encrypted_access-token-123",
                refreshToken: "encrypted_refresh-token-123",
                tokenExpiresAt: new Date(),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            prisma_1.default.connectedPlatform.findUnique.mockResolvedValue(mockConnection);
            const result = await oauthService_1.oauthService.getConnection(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toEqual({
                ...mockConnection,
                accessToken: "access-token-123",
                refreshToken: "refresh-token-123",
            });
        });
        it("should return null if connection not found", async () => {
            prisma_1.default.connectedPlatform.findUnique.mockResolvedValue(null);
            const result = await oauthService_1.oauthService.getConnection(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBeNull();
        });
    });
    describe("getUserConnections", () => {
        it("should retrieve all user connections", async () => {
            const mockConnections = [
                {
                    platform: client_1.Platform.YOUTUBE,
                    platformUserId: "youtube-123",
                    connectedAt: new Date(),
                    tokenExpiresAt: new Date(),
                },
                {
                    platform: client_1.Platform.INSTAGRAM,
                    platformUserId: "instagram-123",
                    connectedAt: new Date(),
                    tokenExpiresAt: new Date(),
                },
            ];
            prisma_1.default.connectedPlatform.findMany.mockResolvedValue(mockConnections);
            const result = await oauthService_1.oauthService.getUserConnections(mockUserId);
            expect(result).toEqual(mockConnections);
            expect(prisma_1.default.connectedPlatform.findMany).toHaveBeenCalledWith({
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
            const result = oauthService_1.oauthService.isTokenExpired(null);
            expect(result).toBe(false);
        });
        it("should return true for expired token", () => {
            const expiredDate = new Date(Date.now() - 3600 * 1000);
            const result = oauthService_1.oauthService.isTokenExpired(expiredDate);
            expect(result).toBe(true);
        });
        it("should return false for valid token", () => {
            const futureDate = new Date(Date.now() + 3600 * 1000);
            const result = oauthService_1.oauthService.isTokenExpired(futureDate);
            expect(result).toBe(false);
        });
        it("should consider buffer time", () => {
            const nearExpiryDate = new Date(Date.now() + 15 * 60 * 1000);
            const result = oauthService_1.oauthService.isTokenExpired(nearExpiryDate, 30);
            expect(result).toBe(true);
        });
    });
    describe("validateToken", () => {
        beforeEach(() => {
            const mockConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "encrypted_access-token-123",
                refreshToken: "encrypted_refresh-token-123",
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            prisma_1.default.connectedPlatform.findUnique.mockResolvedValue(mockConnection);
        });
        it("should validate YouTube token successfully", async () => {
            mockedAxios.get.mockResolvedValue({ status: 200 });
            const result = await oauthService_1.oauthService.validateToken(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith("https://www.googleapis.com/youtube/v3/channels", {
                params: { part: "id", mine: true },
                headers: { Authorization: "Bearer access-token-123" },
            });
        });
        it("should return false for invalid token", async () => {
            mockedAxios.get.mockRejectedValue(new Error("Unauthorized"));
            const result = await oauthService_1.oauthService.validateToken(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBe(false);
        });
        it("should return false for expired token", async () => {
            const expiredConnection = {
                id: "conn-123",
                platform: client_1.Platform.YOUTUBE,
                platformUserId: "platform-user-123",
                accessToken: "encrypted_access-token-123",
                refreshToken: "encrypted_refresh-token-123",
                tokenExpiresAt: new Date(Date.now() - 3600 * 1000),
                connectedAt: new Date(),
                userId: mockUserId,
            };
            prisma_1.default.connectedPlatform.findUnique.mockResolvedValue(expiredConnection);
            const result = await oauthService_1.oauthService.validateToken(mockUserId, client_1.Platform.YOUTUBE);
            expect(result).toBe(false);
        });
    });
    describe("disconnectPlatform", () => {
        it("should disconnect platform successfully", async () => {
            prisma_1.default.connectedPlatform.delete.mockResolvedValue({});
            await oauthService_1.oauthService.disconnectPlatform(mockUserId, client_1.Platform.YOUTUBE);
            expect(prisma_1.default.connectedPlatform.delete).toHaveBeenCalledWith({
                where: {
                    userId_platform: {
                        userId: mockUserId,
                        platform: client_1.Platform.YOUTUBE,
                    },
                },
            });
        });
        it("should handle deletion errors", async () => {
            prisma_1.default.connectedPlatform.delete.mockRejectedValue(new Error("Database error"));
            await expect(oauthService_1.oauthService.disconnectPlatform(mockUserId, client_1.Platform.YOUTUBE)).rejects.toThrow("Failed to disconnect platform");
        });
    });
});
//# sourceMappingURL=oauthService.test.js.map