"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const oauthRoutes_1 = require("../oauthRoutes");
const oauthService_1 = require("../../services/oauthService");
const client_1 = require("@prisma/client");
jest.mock("../../services/oauthService");
jest.mock("../../middleware/authMiddleware", () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: "user-123" };
        next();
    },
}));
jest.mock("../../config/oauth", () => ({
    passport: {
        authenticate: jest.fn(() => (req, res, next) => {
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
const mockedOAuthService = oauthService_1.oauthService;
describe("OAuth Routes", () => {
    let app;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use("/oauth", oauthRoutes_1.oauthRoutes);
        jest.clearAllMocks();
    });
    describe("GET /oauth/connections", () => {
        it("should return user connections", async () => {
            const mockConnections = [
                {
                    platform: client_1.Platform.YOUTUBE,
                    platformUserId: "youtube-123",
                    connectedAt: new Date(),
                    tokenExpiresAt: new Date(),
                },
            ];
            mockedOAuthService.getUserConnections.mockResolvedValue(mockConnections);
            const response = await (0, supertest_1.default)(app).get("/oauth/connections").expect(200);
            expect(response.body.connections).toHaveLength(1);
            expect(response.body.connections[0].platform).toBe(client_1.Platform.YOUTUBE);
            expect(response.body.connections[0].platformUserId).toBe("youtube-123");
            expect(mockedOAuthService.getUserConnections).toHaveBeenCalledWith("user-123");
        });
        it("should handle service errors", async () => {
            mockedOAuthService.getUserConnections.mockRejectedValue(new Error("Service error"));
            const response = await (0, supertest_1.default)(app).get("/oauth/connections").expect(500);
            expect(response.body).toEqual({ error: "Failed to get connections" });
        });
    });
    describe("GET /oauth/validate/:platform", () => {
        it("should validate token for valid platform", async () => {
            mockedOAuthService.validateToken.mockResolvedValue(true);
            const response = await (0, supertest_1.default)(app).get("/oauth/validate/youtube").expect(200);
            expect(response.body).toEqual({ platform: "youtube", isValid: true });
            expect(mockedOAuthService.validateToken).toHaveBeenCalledWith("user-123", client_1.Platform.YOUTUBE);
        });
        it("should return 400 for invalid platform", async () => {
            const response = await (0, supertest_1.default)(app).get("/oauth/validate/invalid-platform").expect(400);
            expect(response.body).toEqual({ error: "Invalid platform" });
        });
        it("should handle validation errors", async () => {
            mockedOAuthService.validateToken.mockRejectedValue(new Error("Validation error"));
            const response = await (0, supertest_1.default)(app).get("/oauth/validate/youtube").expect(500);
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
            const response = await (0, supertest_1.default)(app).post("/oauth/refresh/youtube").expect(200);
            expect(response.body.platform).toBe("youtube");
            expect(response.body.refreshed).toBe(true);
            expect(response.body.expiresAt).toBeDefined();
            expect(mockedOAuthService.refreshToken).toHaveBeenCalledWith("user-123", client_1.Platform.YOUTUBE);
        });
        it("should handle platforms that do not need refresh", async () => {
            mockedOAuthService.refreshToken.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app).post("/oauth/refresh/twitter").expect(200);
            expect(response.body).toEqual({
                platform: "twitter",
                refreshed: false,
                message: "Token refresh not needed or not supported for this platform",
            });
        });
        it("should return 400 for invalid platform", async () => {
            const response = await (0, supertest_1.default)(app).post("/oauth/refresh/invalid-platform").expect(400);
            expect(response.body).toEqual({ error: "Invalid platform" });
        });
    });
    describe("DELETE /oauth/disconnect/:platform", () => {
        it("should disconnect platform successfully", async () => {
            mockedOAuthService.disconnectPlatform.mockResolvedValue();
            const response = await (0, supertest_1.default)(app).delete("/oauth/disconnect/youtube").expect(200);
            expect(response.body).toEqual({ platform: "youtube", disconnected: true });
            expect(mockedOAuthService.disconnectPlatform).toHaveBeenCalledWith("user-123", client_1.Platform.YOUTUBE);
        });
        it("should return 400 for invalid platform", async () => {
            const response = await (0, supertest_1.default)(app).delete("/oauth/disconnect/invalid-platform").expect(400);
            expect(response.body).toEqual({ error: "Invalid platform" });
        });
        it("should handle disconnection errors", async () => {
            mockedOAuthService.disconnectPlatform.mockRejectedValue(new Error("Disconnect error"));
            const response = await (0, supertest_1.default)(app).delete("/oauth/disconnect/youtube").expect(500);
            expect(response.body).toEqual({ error: "Failed to disconnect platform" });
        });
    });
});
//# sourceMappingURL=oauthRoutes.test.js.map