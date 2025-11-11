"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRoutes = void 0;
const express_1 = require("express");
const oauth_1 = require("../config/oauth");
const oauthService_1 = require("../services/oauthService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.oauthRoutes = router;
router.get("/connect/:platform", authMiddleware_1.authenticateToken, (req, res, next) => {
    const { platform } = req.params;
    const userId = req.user.id;
    req.session = req.session || {};
    req.session.userId = userId;
    const validPlatforms = ["youtube", "instagram", "twitter", "tiktok"];
    if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
    }
    return oauth_1.passport.authenticate(platform, {
        session: false,
        state: userId,
    })(req, res, next);
});
router.get("/youtube/callback", oauth_1.passport.authenticate("youtube", { session: false }), async (req, res) => {
    try {
        const oauthData = req.user;
        const userId = req.query.state || req.session?.userId;
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
        }
        await oauthService_1.oauthService.storeConnection(userId, oauthData);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=youtube`);
    }
    catch (error) {
        console.error("YouTube OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect YouTube`);
    }
});
router.get("/instagram/callback", oauth_1.passport.authenticate("instagram", { session: false }), async (req, res) => {
    try {
        const oauthData = req.user;
        const userId = req.query.state || req.session?.userId;
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
        }
        await oauthService_1.oauthService.storeConnection(userId, oauthData);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=instagram`);
    }
    catch (error) {
        console.error("Instagram OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect Instagram`);
    }
});
router.get("/twitter/callback", oauth_1.passport.authenticate("twitter", { session: false }), async (req, res) => {
    try {
        const oauthData = req.user;
        const userId = req.query.state || req.session?.userId;
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
        }
        await oauthService_1.oauthService.storeConnection(userId, oauthData);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=twitter`);
    }
    catch (error) {
        console.error("Twitter OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect Twitter`);
    }
});
router.get("/tiktok/callback", oauth_1.passport.authenticate("tiktok", { session: false }), async (req, res) => {
    try {
        const oauthData = req.user;
        const userId = req.query.state || req.session?.userId;
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
        }
        await oauthService_1.oauthService.storeConnection(userId, oauthData);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=tiktok`);
    }
    catch (error) {
        console.error("TikTok OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect TikTok`);
    }
});
router.get("/connections", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connections = await oauthService_1.oauthService.getUserConnections(userId);
        return res.json({ connections });
    }
    catch (error) {
        console.error("Error getting connections:", error);
        return res.status(500).json({ error: "Failed to get connections" });
    }
});
router.get("/validate/:platform", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        if (!Object.values(client_1.Platform).includes(platform.toUpperCase())) {
            return res.status(400).json({ error: "Invalid platform" });
        }
        const platformEnum = platform.toUpperCase();
        const isValid = await oauthService_1.oauthService.validateToken(userId, platformEnum);
        return res.json({ platform, isValid });
    }
    catch (error) {
        console.error("Error validating token:", error);
        return res.status(500).json({ error: "Failed to validate token" });
    }
});
router.post("/refresh/:platform", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        if (!Object.values(client_1.Platform).includes(platform.toUpperCase())) {
            return res.status(400).json({ error: "Invalid platform" });
        }
        const platformEnum = platform.toUpperCase();
        const refreshResult = await oauthService_1.oauthService.refreshToken(userId, platformEnum);
        if (refreshResult) {
            return res.json({
                platform,
                refreshed: true,
                expiresAt: refreshResult.expiresAt,
            });
        }
        else {
            return res.json({
                platform,
                refreshed: false,
                message: "Token refresh not needed or not supported for this platform",
            });
        }
    }
    catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ error: "Failed to refresh token" });
    }
});
router.delete("/disconnect/:platform", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        if (!Object.values(client_1.Platform).includes(platform.toUpperCase())) {
            return res.status(400).json({ error: "Invalid platform" });
        }
        const platformEnum = platform.toUpperCase();
        await oauthService_1.oauthService.disconnectPlatform(userId, platformEnum);
        return res.json({ platform, disconnected: true });
    }
    catch (error) {
        console.error("Error disconnecting platform:", error);
        return res.status(500).json({ error: "Failed to disconnect platform" });
    }
});
//# sourceMappingURL=oauthRoutes.js.map