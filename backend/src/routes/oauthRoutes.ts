import { Router, Request, Response, NextFunction } from "express";
import { passport } from "../config/oauth";
import { oauthService } from "../services/oauthService";
import { authenticateToken } from "../middleware/authMiddleware";
import { Platform } from "@prisma/client";
import { encrypt } from "../utils/encryption";
import { socialMediaServiceFactory } from "../services/socialMedia/socialMediaServiceFactory";

const router = Router();

/**
 * GET /oauth/connect/:platform
 * Initiate OAuth flow for a platform
 */
router.get("/connect/:platform", authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  const { platform } = req.params;
  const userId = (req as any).user.id;

  // Store user ID in session for callback
  req.session = req.session || {};
  (req.session as any).userId = userId;

  // Validate platform
  const validPlatforms = ["youtube", "instagram", "twitter", "tiktok"];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  // Special handling for TikTok following their official recommendation
  if (platform === "tiktok") {
    // Generate CSRF state that includes userId for security and persistence
    const csrfState = `${userId}.${Math.random().toString(36).substring(2)}`;

    const clientKey = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.BACKEND_URL || "http://localhost:3001"}/api/oauth/tiktok/callback`;
    const scope = "user.info.profile,user.info.stats,video.list"; // Use your sandbox scopes

    // Build TikTok authorization URL following their official format
    let authUrl = "https://www.tiktok.com/v2/auth/authorize/";
    authUrl += `?client_key=${encodeURIComponent(clientKey!)}`;
    authUrl += `&scope=${encodeURIComponent(scope)}`;
    authUrl += "&response_type=code";
    authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    authUrl += `&state=${csrfState}`;

    console.log("Generated TikTok Auth URL:", authUrl);

    return res.status(200).json({
      authUrl,
      message: "TikTok authorization URL generated successfully",
    });
  }

  // For other platforms, generate auth URLs and return as JSON
  let authUrl = "";

  switch (platform) {
    case "youtube":
      const youtubeScope = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile";
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + `client_id=${encodeURIComponent(process.env.YOUTUBE_CLIENT_ID!)}&` + `redirect_uri=${encodeURIComponent(`${process.env.BACKEND_URL}/api/oauth/youtube/callback`)}&` + `scope=${encodeURIComponent(youtubeScope)}&` + `response_type=code&` + `state=${encodeURIComponent(userId)}`;
      break;

    case "instagram":
      authUrl = `https://api.instagram.com/oauth/authorize?` + `client_id=${encodeURIComponent(process.env.INSTAGRAM_CLIENT_ID!)}&` + `redirect_uri=${encodeURIComponent(`${process.env.BACKEND_URL}/api/oauth/instagram/callback`)}&` + `scope=user_profile,user_media&` + `response_type=code&` + `state=${encodeURIComponent(userId)}`;
      break;

    case "twitter":
      // Twitter OAuth 1.0a requires request token first, so we'll use passport for this
      return passport.authenticate(platform, {
        session: false,
        state: userId,
      })(req, res, next);

    default:
      return res.status(400).json({ error: "Unsupported platform" });
  }

  return res.json({
    authUrl,
    message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} authorization URL generated successfully`,
  });
});

/**
 * YouTube OAuth callback
 */
router.get("/youtube/callback", passport.authenticate("youtube", { session: false }), async (req: Request, res: Response) => {
  try {
    const oauthData = req.user as any;
    const userId = (req.query.state as string) || (req.session as any)?.userId;

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
    }

    await oauthService.storeConnection(userId, oauthData);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=youtube`);
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect YouTube`);
  }
});

/**
 * Instagram OAuth callback
 */
router.get("/instagram/callback", passport.authenticate("instagram", { session: false }), async (req: Request, res: Response) => {
  try {
    const oauthData = req.user as any;
    const userId = (req.query.state as string) || (req.session as any)?.userId;

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
    }

    await oauthService.storeConnection(userId, oauthData);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=instagram`);
  } catch (error) {
    console.error("Instagram OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect Instagram`);
  }
});

/**
 * POST /oauth/facebook/token
 * Handle Facebook SDK token and complete OAuth flow
 */
router.post("/facebook/token", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accessToken, userID } = req.body;
    const userId = (req as any).user.id;

    if (!accessToken || !userID) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "accessToken and userID are required",
      });
    }

    // Verify the Facebook token and get user info
    try {
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
      const userData = await userResponse.json();

      if (!userData.id || userData.id !== userID) {
        return res.status(400).json({
          error: "Invalid token",
          message: "Facebook token validation failed",
        });
      }

      // Store the Facebook connection
      const oauthData = {
        platform: Platform.FACEBOOK,
        platformUserId: userData.id,
        accessToken: accessToken,
        refreshToken: null, // Facebook SDK tokens don't have refresh tokens
        profile: userData,
        tokenExpiresAt: new Date(Date.now() + 2 * 3600 * 1000), // 2 hours from now
      };

      await oauthService.storeConnection(userId, oauthData);

      return res.json({
        success: true,
        message: "Facebook account connected successfully",
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        },
      });
    } catch (fbError) {
      console.error("Facebook API error:", fbError);
      return res.status(400).json({
        error: "Facebook API error",
        message: "Failed to verify Facebook token",
      });
    }
  } catch (error) {
    console.error("Error handling Facebook token:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process Facebook connection",
    });
  }
});

export { router as oauthRoutes };

/**
 * Twitter OAuth callback
 */
router.get("/twitter/callback", passport.authenticate("twitter", { session: false }), async (req: Request, res: Response) => {
  try {
    const oauthData = req.user as any;
    const userId = (req.query.state as string) || (req.session as any)?.userId;

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
    }

    await oauthService.storeConnection(userId, oauthData);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=twitter`);
  } catch (error) {
    console.error("Twitter OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect Twitter`);
  }
});

/**
 * TikTok OAuth callback - Following TikTok's official recommendation
 */
router.get("/tiktok/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("TikTok OAuth error:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=TikTok authorization failed`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing authorization code or state`);
    }

    // Extract userId from state parameter (format: "userId.randomString")
    const stateParts = (state as string).split(".");
    if (stateParts.length !== 2) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Invalid state format`);
    }

    const userId = stateParts[0];
    const randomPart = stateParts[1];

    // Basic validation - ensure userId exists and random part has minimum length
    if (!userId || randomPart.length < 8) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Invalid state parameter`);
    }

    // Exchange code for access token (simplified without PKCE)
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_ID!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code as string,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;

    if (tokenData?.error) {
      console.error("TikTok token exchange error:", tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to exchange authorization code`);
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    // Get user info with your sandbox scope fields
    let userInfo = { open_id };
    try {
      const service = socialMediaServiceFactory.getService(Platform.TIKTOK);
      const userData = await service.fetchUserInfo(access_token);
      userInfo = userData;
    } catch (userError) {
      console.warn("Failed to fetch TikTok user info:", userError);
    }

    // Store connection
    const oauthData = {
      platform: Platform.TIKTOK,
      platformUserId: userInfo.open_id || open_id,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      profile: userInfo,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
    };

    await oauthService.storeConnection(userId, oauthData);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=tiktok`);
  } catch (error) {
    console.error("TikTok OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Failed to connect TikTok`);
  }
});

/**
 * Get user's connected platforms
 */
router.get("/connections", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const connections = await oauthService.getUserConnections(userId);

    return res.json({ connections });
  } catch (error) {
    console.error("Error getting connections:", error);
    return res.status(500).json({ error: "Failed to get connections" });
  }
});

/**
 * Validate token for a platform
 */
router.get("/validate/:platform", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = (req as any).user.id;

    // Validate platform parameter
    if (!Object.values(Platform).includes(platform.toUpperCase() as Platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const platformEnum = platform.toUpperCase() as Platform;
    const isValid = await oauthService.validateToken(userId, platformEnum);

    return res.json({ platform, isValid });
  } catch (error) {
    console.error("Error validating token:", error);
    return res.status(500).json({ error: "Failed to validate token" });
  }
});

/**
 * Refresh token for a platform
 */
router.post("/refresh/:platform", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = (req as any).user.id;

    // Validate platform parameter
    if (!Object.values(Platform).includes(platform.toUpperCase() as Platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const platformEnum = platform.toUpperCase() as Platform;
    const refreshResult = await oauthService.refreshToken(userId, platformEnum);

    if (refreshResult) {
      return res.json({
        platform,
        refreshed: true,
        expiresAt: refreshResult.expiresAt,
      });
    } else {
      return res.json({
        platform,
        refreshed: false,
        message: "Token refresh not needed or not supported for this platform",
      });
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
});

/**
 * Disconnect a platform
 */
router.delete("/disconnect/:platform", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = (req as any).user.id;

    // Validate platform parameter
    if (!Object.values(Platform).includes(platform.toUpperCase() as Platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const platformEnum = platform.toUpperCase() as Platform;
    await oauthService.disconnectPlatform(userId, platformEnum);

    return res.json({ platform, disconnected: true });
  } catch (error) {
    console.error("Error disconnecting platform:", error);
    return res.status(500).json({ error: "Failed to disconnect platform" });
  }
});
