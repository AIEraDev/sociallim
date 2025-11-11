import request from "supertest";
import express from "express";
import { oauthRoutes } from "../oauthRoutes";
import { oauthService } from "../../services/oauthService";
import { Platform } from "@prisma/client";

// Mock dependencies
jest.mock("../../services/oauthService");
jest.mock("../../middleware/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: "user-123" };
    next();
  },
}));

jest.mock("../../config/oauth", () => ({
  passport: {
    authenticate: jest.fn(() => (req: any, res: any, next: any) => {
      req.user = {
        platform: "YOUTUBE",
        platformUserId: "platform-123",
        accessToken: "encrypted_token",
        refreshToken: "encrypted_refresh",
        tokenExpiresAt: new Date(),
      };
      next();
    }),
  },
}));

const mockedOAuthService = oauthService as jest.Mocked<typeof oauthService>;

describe("OAuth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/oauth", oauthRoutes);
    jest.clearAllMocks();
  });

  describe("GET /oauth/connections", () => {
    it("should return user connections", async () => {
      const mockConnections = [
        {
          platform: Platform.YOUTUBE,
          platformUserId: "youtube-123",
          connectedAt: new Date(),
          tokenExpiresAt: new Date(),
        },
      ];

      mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);

      const response = await request(app).get("/oauth/connections").expect(200);

      expect(response.body.connections).toHaveLength(1);
      expect(response.body.connections[0].platform).toBe(Platform.YOUTUBE);
      expect(response.body.connections[0].platformUserId).toBe("youtube-123");
      expect(mockedOAuthService.getUserConnections).toHaveBeenCalledWith("user-123");
    });

    it("should handle service errors", async () => {
      mockedOAuthService.getUserConnections.mockRejectedValue(new Error("Service error"));

      const response = await request(app).get("/oauth/connections").expect(500);

      expect(response.body).toEqual({ error: "Failed to get connections" });
    });
  });

  describe("GET /oauth/validate/:platform", () => {
    it("should validate token for valid platform", async () => {
      mockedOAuthService.validateToken.mockResolvedValue(true);

      const response = await request(app).get("/oauth/validate/youtube").expect(200);

      expect(response.body).toEqual({ platform: "youtube", isValid: true });
      expect(mockedOAuthService.validateToken).toHaveBeenCalledWith("user-123", Platform.YOUTUBE);
    });

    it("should return 400 for invalid platform", async () => {
      const response = await request(app).get("/oauth/validate/invalid-platform").expect(400);

      expect(response.body).toEqual({ error: "Invalid platform" });
    });

    it("should handle validation errors", async () => {
      mockedOAuthService.validateToken.mockRejectedValue(new Error("Validation error"));

      const response = await request(app).get("/oauth/validate/youtube").expect(500);

      expect(response.body).toEqual({ error: "Failed to validate token" });
    });
  });

  describe("POST /oauth/refresh/:platform", () => {
    it("should refresh token successfully", async () => {
      const mockRefreshResult = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(),
      };

      mockedOAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      const response = await request(app).post("/oauth/refresh/youtube").expect(200);

      expect(response.body.platform).toBe("youtube");
      expect(response.body.refreshed).toBe(true);
      expect(response.body.expiresAt).toBeDefined();
      expect(mockedOAuthService.refreshToken).toHaveBeenCalledWith("user-123", Platform.YOUTUBE);
    });

    it("should handle platforms that do not need refresh", async () => {
      mockedOAuthService.refreshToken.mockResolvedValue(null);

      const response = await request(app).post("/oauth/refresh/twitter").expect(200);

      expect(response.body).toEqual({
        platform: "twitter",
        refreshed: false,
        message: "Token refresh not needed or not supported for this platform",
      });
    });

    it("should return 400 for invalid platform", async () => {
      const response = await request(app).post("/oauth/refresh/invalid-platform").expect(400);

      expect(response.body).toEqual({ error: "Invalid platform" });
    });
  });

  describe("DELETE /oauth/disconnect/:platform", () => {
    it("should disconnect platform successfully", async () => {
      mockedOAuthService.disconnectPlatform.mockResolvedValue();

      const response = await request(app).delete("/oauth/disconnect/youtube").expect(200);

      expect(response.body).toEqual({ platform: "youtube", disconnected: true });
      expect(mockedOAuthService.disconnectPlatform).toHaveBeenCalledWith("user-123", Platform.YOUTUBE);
    });

    it("should return 400 for invalid platform", async () => {
      const response = await request(app).delete("/oauth/disconnect/invalid-platform").expect(400);

      expect(response.body).toEqual({ error: "Invalid platform" });
    });

    it("should handle disconnection errors", async () => {
      mockedOAuthService.disconnectPlatform.mockRejectedValue(new Error("Disconnect error"));

      const response = await request(app).delete("/oauth/disconnect/youtube").expect(500);

      expect(response.body).toEqual({ error: "Failed to disconnect platform" });
    });
  });
});
