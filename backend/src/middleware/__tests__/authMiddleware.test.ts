// Set environment variables before any imports
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

import { Request, Response, NextFunction } from "express";
import { authenticateToken, optionalAuth, requireAuth, authRateLimit } from "../authMiddleware";
import { AuthService } from "../../services/authService";

// Mock AuthService
jest.mock("../../services/authService");
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("Authentication Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith("valid.jwt.token");
      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          id: "user123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        })
      );
      expect(mockRequest.user).not.toHaveProperty("password");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 401 when no token provided", async () => {
      mockRequest.headers = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

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

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

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

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

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

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          id: "user123",
          email: "test@example.com",
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should continue without user when no token provided", async () => {
      mockRequest.headers = {};

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should continue without user when token is invalid", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid.jwt.token",
      };
      mockAuthService.verifyToken.mockResolvedValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

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

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", () => {
      mockRequest.user = undefined;

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access denied",
        message: "Authentication required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authRateLimit", () => {
    let rateLimitMiddleware: any;

    beforeEach(() => {
      rateLimitMiddleware = authRateLimit(3, 60000); // 3 attempts per minute
      Object.defineProperty(mockRequest, "ip", { value: "127.0.0.1", writable: true });
    });

    it("should allow requests within rate limit", () => {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should block requests exceeding rate limit", () => {
      // Make 4 requests (exceeding limit of 3)
      for (let i = 0; i < 4; i++) {
        rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Too many requests",
          message: expect.stringContaining("Too many authentication attempts"),
        })
      );
    });
  });
});
