import request from "supertest";
import express from "express";
import { tokenRoutes } from "../tokenRoutes";
import { tokenManager } from "../../services/tokenManager";
import { Platform } from "@prisma/client";

// Mock dependencies
jest.mock("../../services/tokenManager");
jest.mock("../../middleware/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: "user-123" };
    next();
  },
}));

const mockedTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;

describe("Token Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/tokens", tokenRoutes);
    jest.clearAllMocks();
  });

  describe("GET /tokens/validate-all", () => {
    it("should validate all tokens for user", async () => {
      const mockResults = [
        {
          platform: Platform.YOUTUBE,
          isValid: true,
          needsReconnection: false,
        },
        {
          platform: Platform.INSTAGRAM,
          isValid: false,
          needsReconnection: true,
        },
      ];

      mockedTokenManager.validateAllTokens.mockResolvedValue(mockResults);

      const response = await request(app).get("/tokens/validate-all").expect(200);

      expect(response.body.userId).toBe("user-123");
      expect(response.body.tokenStatus).toEqual(mockResults);
      expect(response.body.timestamp).toBeDefined();
      expect(mockedTokenManager.validateAllTokens).toHaveBeenCalledWith("user-123");
    });

    it("should handle validation errors", async () => {
      mockedTokenManager.validateAllTokens.mockRejectedValue(new Error("Validation error"));

      const response = await request(app).get("/tokens/validate-all").expect(500);

      expect(response.body).toEqual({ error: "Failed to validate tokens" });
    });
  });

  describe("POST /tokens/refresh-expiring", () => {
    it("should refresh expiring tokens", async () => {
      const mockResults = [
        {
          platform: Platform.YOUTUBE,
          refreshed: true,
        },
        {
          platform: Platform.INSTAGRAM,
          refreshed: false,
        },
      ];

      mockedTokenManager.refreshExpiringTokens.mockResolvedValue(mockResults);

      const response = await request(app).post("/tokens/refresh-expiring").expect(200);

      expect(response.body.userId).toBe("user-123");
      expect(response.body.refreshResults).toEqual(mockResults);
      expect(response.body.timestamp).toBeDefined();
      expect(mockedTokenManager.refreshExpiringTokens).toHaveBeenCalledWith("user-123");
    });

    it("should handle refresh errors", async () => {
      mockedTokenManager.refreshExpiringTokens.mockRejectedValue(new Error("Refresh error"));

      const response = await request(app).post("/tokens/refresh-expiring").expect(500);

      expect(response.body).toEqual({ error: "Failed to refresh tokens" });
    });
  });

  describe("GET /tokens/valid/:platform", () => {
    it("should return valid token status for platform", async () => {
      mockedTokenManager.getValidToken.mockResolvedValue("valid-token");

      const response = await request(app).get("/tokens/valid/youtube").expect(200);

      expect(response.body.platform).toBe("youtube");
      expect(response.body.hasValidToken).toBe(true);
      expect(response.body.message).toBe("Valid token available for API calls");
      expect(response.body.timestamp).toBeDefined();
      expect(mockedTokenManager.getValidToken).toHaveBeenCalledWith("user-123", Platform.YOUTUBE);
    });

    it("should return 404 if no valid token available", async () => {
      mockedTokenManager.getValidToken.mockResolvedValue(null);

      const response = await request(app).get("/tokens/valid/youtube").expect(404);

      expect(response.body.error).toBe("No valid token available");
      expect(response.body.message).toBe("Please reconnect your account");
      expect(response.body.platform).toBe("youtube");
    });

    it("should return 400 for invalid platform", async () => {
      const response = await request(app).get("/tokens/valid/invalid-platform").expect(400);

      expect(response.body).toEqual({ error: "Invalid platform" });
    });

    it("should return 401 for token refresh failure", async () => {
      mockedTokenManager.getValidToken.mockRejectedValue(new Error("Token refresh failed for YOUTUBE. Please reconnect your account."));

      const response = await request(app).get("/tokens/valid/youtube").expect(401);

      expect(response.body.error).toBe("Token refresh failed");
      expect(response.body.needsReconnection).toBe(true);
    });
  });

  describe("GET /tokens/health", () => {
    it("should return token health summary", async () => {
      const mockResults = [
        {
          platform: Platform.YOUTUBE,
          isValid: true,
          needsReconnection: false,
        },
        {
          platform: Platform.INSTAGRAM,
          isValid: false,
          needsReconnection: true,
        },
      ];

      mockedTokenManager.validateAllTokens.mockResolvedValue(mockResults);

      const response = await request(app).get("/tokens/health").expect(200);

      expect(response.body.userId).toBe("user-123");
      expect(response.body.tokenHealth.totalConnections).toBe(2);
      expect(response.body.tokenHealth.validConnections).toBe(1);
      expect(response.body.tokenHealth.invalidConnections).toBe(1);
      expect(response.body.tokenHealth.needsReconnection).toBe(1);
      expect(response.body.tokenHealth.platforms).toHaveLength(2);
      expect(response.body.timestamp).toBeDefined();
    });

    it("should handle health check errors", async () => {
      mockedTokenManager.validateAllTokens.mockRejectedValue(new Error("Health check error"));

      const response = await request(app).get("/tokens/health").expect(500);

      expect(response.body).toEqual({ error: "Failed to check token health" });
    });
  });

  describe("POST /tokens/cleanup-expired", () => {
    it("should cleanup expired tokens", async () => {
      const mockResults = {
        deletedConnections: 2,
        errors: [],
      };

      mockedTokenManager.cleanupExpiredTokens.mockResolvedValue(mockResults);

      const response = await request(app).post("/tokens/cleanup-expired").expect(200);

      expect(response.body.message).toBe("Token cleanup completed");
      expect(response.body.deletedConnections).toBe(2);
      expect(response.body.errors).toEqual([]);
      expect(response.body.timestamp).toBeDefined();
      expect(mockedTokenManager.cleanupExpiredTokens).toHaveBeenCalled();
    });

    it("should handle cleanup errors", async () => {
      mockedTokenManager.cleanupExpiredTokens.mockRejectedValue(new Error("Cleanup error"));

      const response = await request(app).post("/tokens/cleanup-expired").expect(500);

      expect(response.body).toEqual({ error: "Failed to cleanup expired tokens" });
    });
  });
});
