"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-12345";
process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";
process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id";
process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret";
process.env.INSTAGRAM_CLIENT_ID = "test-instagram-client-id";
process.env.INSTAGRAM_CLIENT_SECRET = "test-instagram-client-secret";
process.env.TWITTER_CLIENT_ID = "test-twitter-client-id";
process.env.TWITTER_CLIENT_SECRET = "test-twitter-client-secret";
process.env.TIKTOK_CLIENT_ID = "test-tiktok-client-id";
process.env.TIKTOK_CLIENT_SECRET = "test-tiktok-client-secret";
process.env.OPENAI_API_KEY = "test-openai-api-key";
const authMiddleware_1 = require("../authMiddleware");
const authService_1 = require("../../services/authService");
jest.mock("../../services/authService");
const mockAuthService = authService_1.AuthService;
describe("Authentication Middleware", () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        mockRequest = {
            headers: {},
            user: undefined,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });
    describe("authenticateToken", () => {
        it("should authenticate valid token and attach user to request", async () => {
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                password: "hashedPassword",
                firstName: "John",
                lastName: "Doe",
                isEmailVerified: false,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockRequest.headers = {
                authorization: "Bearer valid.jwt.token",
            };
            mockAuthService.verifyToken.mockResolvedValue(mockUser);
            await (0, authMiddleware_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            expect(mockAuthService.verifyToken).toHaveBeenCalledWith("valid.jwt.token");
            expect(mockRequest.user).toEqual(expect.objectContaining({
                id: "user123",
                email: "test@example.com",
                firstName: "John",
                lastName: "Doe",
            }));
            expect(mockRequest.user).not.toHaveProperty("password");
            expect(mockNext).toHaveBeenCalled();
        });
        it("should return 401 when no token provided", async () => {
            mockRequest.headers = {};
            await (0, authMiddleware_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Access denied",
                message: "No token provided",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it("should return 401 when token is invalid", async () => {
            mockRequest.headers = {
                authorization: "Bearer invalid.jwt.token",
            };
            mockAuthService.verifyToken.mockResolvedValue(null);
            await (0, authMiddleware_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Access denied",
                message: "Invalid or expired token",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it("should handle authentication service errors", async () => {
            mockRequest.headers = {
                authorization: "Bearer valid.jwt.token",
            };
            mockAuthService.verifyToken.mockRejectedValue(new Error("Service error"));
            await (0, authMiddleware_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
                message: "Authentication failed",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe("optionalAuth", () => {
        it("should attach user when valid token provided", async () => {
            const mockUser = {
                id: "user123",
                email: "test@example.com",
                password: "hashedPassword",
                firstName: "John",
                lastName: "Doe",
                isEmailVerified: false,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockRequest.headers = {
                authorization: "Bearer valid.jwt.token",
            };
            mockAuthService.verifyToken.mockResolvedValue(mockUser);
            await (0, authMiddleware_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.user).toEqual(expect.objectContaining({
                id: "user123",
                email: "test@example.com",
            }));
            expect(mockNext).toHaveBeenCalled();
        });
        it("should continue without user when no token provided", async () => {
            mockRequest.headers = {};
            await (0, authMiddleware_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
        it("should continue without user when token is invalid", async () => {
            mockRequest.headers = {
                authorization: "Bearer invalid.jwt.token",
            };
            mockAuthService.verifyToken.mockResolvedValue(null);
            await (0, authMiddleware_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe("requireAuth", () => {
        it("should continue when user is authenticated", () => {
            mockRequest.user = {
                id: "user123",
                email: "test@example.com",
                firstName: "John",
                lastName: "Doe",
                isEmailVerified: false,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (0, authMiddleware_1.requireAuth)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it("should return 401 when user is not authenticated", () => {
            mockRequest.user = undefined;
            (0, authMiddleware_1.requireAuth)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Access denied",
                message: "Authentication required",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe("authRateLimit", () => {
        let rateLimitMiddleware;
        beforeEach(() => {
            rateLimitMiddleware = (0, authMiddleware_1.authRateLimit)(3, 60000);
            Object.defineProperty(mockRequest, "ip", { value: "127.0.0.1", writable: true });
        });
        it("should allow requests within rate limit", () => {
            rateLimitMiddleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it("should block requests exceeding rate limit", () => {
            for (let i = 0; i < 4; i++) {
                rateLimitMiddleware(mockRequest, mockResponse, mockNext);
            }
            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: "Too many requests",
                message: expect.stringContaining("Too many authentication attempts"),
            }));
        });
    });
});
//# sourceMappingURL=authMiddleware.test.js.map