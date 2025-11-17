"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRoutes = void 0;
const express_1 = require("express");
const oauthService_1 = require("../services/oauthService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const encryption_1 = require("../utils/encryption");
const socialMediaServiceFactory_1 = require("../services/socialMedia/socialMediaServiceFactory");
const twitterService_1 = require("../services/socialMedia/twitterService");
const facebookService_1 = require("../services/socialMedia/facebookService");
const pkce_1 = require("../utils/pkce");
const pkceStore_1 = require("../utils/pkceStore");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
exports.oauthRoutes = router;
router.get("/twitter/authorize", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userConnections = await oauthService_1.oauthService.getUserConnections(userId);
        if (userConnections.some((connection) => connection.platform === client_1.Platform.TWITTER)) {
            return res.status(400).json({
                error: "Twitter account already connected",
            });
        }
        const { codeVerifier, codeChallenge, state } = (0, pkce_1.generatePKCEChallenge)();
        pkceStore_1.PKCEStore.set(state, { codeVerifier, state, userId });
        const authUrl = twitterService_1.twitterService.instance.generateAuthUrl(codeChallenge, state);
        return res.json({
            success: true,
            authUrl,
            state,
        });
    }
    catch (error) {
        console.error("Error generating Twitter auth URL:", error);
        return res.status(500).json({
            error: "Failed to generate authorization URL",
        });
    }
});
router.post("/twitter/callback", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { code, state } = req.body;
        const userId = req.user.id;
        if (!code || !state) {
            return res.status(400).json({
                error: "Missing code or state parameter",
            });
        }
        const pkceData = pkceStore_1.PKCEStore.get(state);
        if (!pkceData) {
            return res.status(400).json({
                error: "Invalid or expired state parameter",
            });
        }
        if (pkceData.userId !== userId) {
            return res.status(403).json({
                error: "User mismatch",
            });
        }
        const tokenData = await twitterService_1.twitterService.instance.exchangeCodeForToken(code, pkceData.codeVerifier);
        const twitterUser = await twitterService_1.twitterService.instance.fetchUserInfo(tokenData.access_token);
        await oauthService_1.oauthService.storeConnection(userId, {
            platform: "TWITTER",
            platformUserId: twitterUser.id,
            accessToken: (0, encryption_1.encrypt)(tokenData.access_token),
            refreshToken: tokenData.refresh_token ? (0, encryption_1.encrypt)(tokenData.refresh_token) : null,
            profile: twitterUser,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        });
        pkceStore_1.PKCEStore.delete(state);
        return res.json({
            success: true,
            message: "Twitter account connected successfully",
            user: {
                id: twitterUser.id,
                name: twitterUser.name,
                username: twitterUser.username,
                profileImage: twitterUser.profileImageUrl,
                followersCount: twitterUser.followersCount,
                followingCount: twitterUser.followingCount,
            },
        });
    }
    catch (error) {
        console.error("Error in Twitter callback:", error);
        if (error.response?.data) {
            return res.status(400).json({
                error: "Twitter API error",
                message: error.response.data.error_description || "Failed to authenticate",
            });
        }
        return res.status(500).json({
            error: "Failed to process Twitter callback",
        });
    }
});
router.delete("/twitter/disconnect", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await oauthService_1.oauthService.disconnectPlatform(userId, "TWITTER");
        return res.json({
            success: true,
            message: "Twitter account disconnected successfully",
        });
    }
    catch (error) {
        console.error("Error disconnecting Twitter:", error);
        return res.status(500).json({
            error: "Failed to disconnect Twitter account",
        });
    }
});
router.get("/connect/tiktok", authMiddleware_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    const csrfState = `${userId}.${Math.random().toString(36).substring(2)}`;
    const clientKey = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.BACKEND_URL || "http://localhost:5628"}/api/oauth/tiktok/callback`;
    const scope = "user.info.profile,user.info.stats,video.list";
    let authUrl = "https://www.tiktok.com/v2/auth/authorize/";
    authUrl += `?client_key=${encodeURIComponent(clientKey)}`;
    authUrl += `&scope=${encodeURIComponent(scope)}`;
    authUrl += "&response_type=code";
    authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    authUrl += `&state=${csrfState}`;
    return res.status(200).json({
        authUrl,
        message: "TikTok authorization URL generated successfully",
    });
});
router.get("/tiktok/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            console.error("TikTok OAuth error:", error);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=TikTok authorization failed`);
        }
        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing authorization code or state`);
        }
        const stateParts = state.split(".");
        if (stateParts.length !== 2) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Invalid state format`);
        }
        const userId = stateParts[0];
        const randomPart = stateParts[1];
        if (!userId || randomPart.length < 8) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Invalid state parameter`);
        }
        const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_ID,
                client_secret: process.env.TIKTOK_CLIENT_SECRET,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: process.env.TIKTOK_REDIRECT_URI,
            }),
        });
        const tokenData = (await tokenResponse.json());
        if (tokenData?.error) {
            console.error("TikTok token exchange error:", tokenData);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to exchange authorization code`);
        }
        const { access_token, refresh_token, expires_in, open_id } = tokenData;
        let userInfo = { open_id };
        try {
            const service = socialMediaServiceFactory_1.socialMediaServiceFactory.getService(client_1.Platform.TIKTOK);
            const userData = await service.fetchUserInfo(access_token);
            userInfo = userData;
        }
        catch (userError) {
            console.warn("Failed to fetch TikTok user info:", userError);
        }
        const oauthData = {
            platform: client_1.Platform.TIKTOK,
            platformUserId: userInfo.open_id || open_id,
            accessToken: (0, encryption_1.encrypt)(access_token),
            refreshToken: (0, encryption_1.encrypt)(refresh_token),
            profile: userInfo,
            tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        };
        await oauthService_1.oauthService.storeConnection(userId, oauthData);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=tiktok`);
    }
    catch (error) {
        console.error("TikTok OAuth callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect TikTok`);
    }
});
router.get("/facebook/authorize", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const state = crypto_1.default.randomBytes(16).toString("base64url");
        const authUrl = facebookService_1.facebookService.instance.generateAuthUrl(state);
        pkceStore_1.PKCEStore.set(state, {
            codeVerifier: "",
            state,
            userId,
        });
        return res.json({ success: true, authUrl, state });
    }
    catch (error) {
        console.error("Error generating Facebook auth URL:", error);
        return res.status(500).json({
            error: "Failed to generate authorization URL",
        });
    }
});
router.get("/facebook/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    const frontendCallback = `${process.env.FRONTEND_URL}/auth/callback/facebook`;
    const params = new URLSearchParams();
    if (code)
        params.append("code", code);
    if (state)
        params.append("state", state);
    if (error)
        params.append("error", error);
    if (error_description)
        params.append("error_description", error_description);
    res.redirect(`${frontendCallback}?${params.toString()}`);
});
router.post("/facebook/callback", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { code, state } = req.body;
        const userId = req.user.id;
        if (!code || !state) {
            return res.status(400).json({
                error: "Missing code or state parameter",
            });
        }
        const stateData = pkceStore_1.PKCEStore.get(state);
        if (!stateData) {
            return res.status(400).json({
                error: "Invalid or expired state parameter",
            });
        }
        if (stateData.userId !== userId) {
            return res.status(403).json({
                error: "User mismatch",
            });
        }
        const shortLivedToken = await facebookService_1.facebookService.instance.exchangeCodeForToken(code);
        const longLivedToken = await facebookService_1.facebookService.instance.getLongLivedToken(shortLivedToken.access_token);
        const facebookUser = await facebookService_1.facebookService.instance.fetchUserInfo(longLivedToken.access_token);
        const pages = await facebookService_1.facebookService.instance.getUserPages(longLivedToken.access_token);
        const instagramAccounts = await facebookService_1.facebookService.instance.getAllInstagramAccounts(longLivedToken.access_token);
        await oauthService_1.oauthService.storeConnection(userId, {
            platform: client_1.Platform.FACEBOOK,
            platformUserId: facebookUser.id,
            accessToken: (0, encryption_1.encrypt)(longLivedToken.access_token),
            refreshToken: null,
            profile: {
                id: facebookUser.id,
                name: facebookUser.name,
                email: facebookUser.email,
                picture: facebookUser.picture?.data?.url,
                pages: pages,
            },
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        });
        for (const { page, instagram } of instagramAccounts) {
            await oauthService_1.oauthService.storeConnection(userId, {
                platform: client_1.Platform.INSTAGRAM,
                platformUserId: instagram.id,
                accessToken: (0, encryption_1.encrypt)(page.access_token),
                refreshToken: null,
                profile: {
                    id: instagram.id,
                    username: instagram.username,
                    name: instagram.name,
                    profilePictureUrl: instagram.profile_picture_url,
                    followersCount: instagram.followers_count,
                    followingCount: instagram.follows_count,
                    mediaCount: instagram.media_count,
                    biography: instagram.biography,
                    website: instagram.website,
                    connectedPageId: page.id,
                    connectedPageName: page.name,
                },
                tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            });
        }
        pkceStore_1.PKCEStore.delete(state);
        return res.json({
            success: true,
            message: "Facebook account connected successfully",
            data: {
                facebook: {
                    id: facebookUser.id,
                    name: facebookUser.name,
                    email: facebookUser.email,
                    picture: facebookUser.picture?.data?.url,
                    pagesCount: pages.length,
                },
                instagram: instagramAccounts.map(({ page, instagram }) => ({
                    id: instagram.id,
                    username: instagram.username,
                    name: instagram.name,
                    followersCount: instagram.followers_count,
                    connectedPage: page.name,
                })),
            },
        });
    }
    catch (error) {
        console.error("Error in Facebook callback:", error);
        if (error.response?.data) {
            return res.status(400).json({
                error: "Facebook API error",
                message: error.response.data.error?.message || "Failed to authenticate",
            });
        }
        return res.status(500).json({
            error: "Failed to process Facebook callback",
        });
    }
});
router.delete("/facebook/disconnect", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await oauthService_1.oauthService.getConnection(userId, client_1.Platform.FACEBOOK);
        if (connection?.accessToken) {
            await facebookService_1.facebookService.instance.revokeToken(connection.accessToken);
        }
        await oauthService_1.oauthService.disconnectPlatform(userId, client_1.Platform.FACEBOOK);
        await oauthService_1.oauthService.disconnectPlatform(userId, client_1.Platform.INSTAGRAM);
        return res.json({
            success: true,
            message: "Facebook and Instagram accounts disconnected successfully",
        });
    }
    catch (error) {
        console.error("Error disconnecting Facebook:", error);
        return res.status(500).json({
            error: "Failed to disconnect Facebook account",
        });
    }
});
exports.default = router;
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