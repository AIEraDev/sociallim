"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRoutes = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const tokenManager_1 = require("../services/tokenManager");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.tokenRoutes = router;
router.get("/validate-all", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const results = await tokenManager_1.tokenManager.validateAllTokens(userId);
        return res.json({
            userId,
            tokenStatus: results,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error validating all tokens:", error);
        return res.status(500).json({ error: "Failed to validate tokens" });
    }
});
router.post("/refresh-expiring", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const results = await tokenManager_1.tokenManager.refreshExpiringTokens(userId);
        return res.json({
            userId,
            refreshResults: results,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error refreshing expiring tokens:", error);
        return res.status(500).json({ error: "Failed to refresh tokens" });
    }
});
router.get("/valid/:platform", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        if (!Object.values(client_1.Platform).includes(platform.toUpperCase())) {
            return res.status(400).json({ error: "Invalid platform" });
        }
        const platformEnum = platform.toUpperCase();
        const validToken = await tokenManager_1.tokenManager.getValidToken(userId, platformEnum);
        if (!validToken) {
            return res.status(404).json({
                error: "No valid token available",
                message: "Please reconnect your account",
                platform: platform,
            });
        }
        return res.json({
            platform,
            hasValidToken: true,
            message: "Valid token available for API calls",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error getting valid token:", error);
        if (error instanceof Error && error.message.includes("Please reconnect")) {
            return res.status(401).json({
                error: "Token refresh failed",
                message: error.message,
                needsReconnection: true,
            });
        }
        return res.status(500).json({ error: "Failed to get valid token" });
    }
});
router.get("/health", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connections = await tokenManager_1.tokenManager.validateAllTokens(userId);
        const summary = {
            totalConnections: connections.length,
            validConnections: connections.filter((c) => c.isValid).length,
            invalidConnections: connections.filter((c) => !c.isValid).length,
            needsReconnection: connections.filter((c) => c.needsReconnection).length,
            platforms: connections.map((c) => ({
                platform: c.platform,
                status: c.isValid ? "valid" : "invalid",
            })),
        };
        return res.json({
            userId,
            tokenHealth: summary,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error checking token health:", error);
        return res.status(500).json({ error: "Failed to check token health" });
    }
});
router.post("/cleanup-expired", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const results = await tokenManager_1.tokenManager.cleanupExpiredTokens();
        return res.json({
            message: "Token cleanup completed",
            deletedConnections: results.deletedConnections,
            errors: results.errors,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error during token cleanup:", error);
        return res.status(500).json({ error: "Failed to cleanup expired tokens" });
    }
});
//# sourceMappingURL=tokenRoutes.js.map