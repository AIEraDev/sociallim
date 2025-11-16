import { Router, Request, Response } from "express";
import { oauthService } from "../services/oauthService";
import { authenticateToken } from "../middleware/authMiddleware";
import { Platform } from "@prisma/client";
import { encrypt } from "../utils/encryption";
import { socialMediaServiceFactory } from "../services/socialMedia/socialMediaServiceFactory";
import { twitterService } from "../services/socialMedia/twitterService";
import { generatePKCEChallenge } from "../utils/pkce";
import { PKCEStore } from "../utils/pkceStore";

const router = Router();

/**
 *
 *
 *
 *
 *
 * TWITTER OAUTH Handler
 *
 *
 *
 *
 *
 *
 */

/**
 * GET /oauth/twitter/authorize
 * Generate Twitter OAuth URL with PKCE
 */
router.get("/twitter/authorize", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // From your auth middleware

    const userConnections = await oauthService.getUserConnections(userId);

    if (userConnections.some((connection) => connection.platform === Platform.TWITTER)) {
      return res.status(400).json({
        error: "Twitter account already connected",
      });
    }

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge, state } = generatePKCEChallenge();

    // Store PKCE data temporarily
    PKCEStore.set(state, { codeVerifier, state, userId });

    // Generate authorization URL using TwitterService directly
    const authUrl = twitterService.instance.generateAuthUrl(codeChallenge, state);

    return res.json({
      success: true,
      authUrl,
      state, // Return state to frontend for validation
    });
  } catch (error) {
    console.error("Error generating Twitter auth URL:", error);
    return res.status(500).json({
      error: "Failed to generate authorization URL",
    });
  }
});

/**
 * POST /oauth/twitter/callback
 * Handle Twitter OAuth callback
 */
router.post("/twitter/callback", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const userId = (req as any).user.id;

    if (!code || !state) {
      return res.status(400).json({
        error: "Missing code or state parameter",
      });
    }

    // Retrieve stored PKCE data
    const pkceData = PKCEStore.get(state);

    if (!pkceData) {
      return res.status(400).json({
        error: "Invalid or expired state parameter",
      });
    }

    // Verify user matches
    if (pkceData.userId !== userId) {
      return res.status(403).json({
        error: "User mismatch",
      });
    }

    // Exchange code for token
    const tokenData = await twitterService.instance.exchangeCodeForToken(code, pkceData.codeVerifier);

    // Fetch user information
    const twitterUser = await twitterService.instance.fetchUserInfo(tokenData.access_token);

    // Store the connection in your database
    await oauthService.storeConnection(userId, {
      platform: "TWITTER",
      platformUserId: twitterUser.id,
      accessToken: encrypt(tokenData.access_token),
      refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
      profile: twitterUser,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    });

    // Clean up PKCE data
    PKCEStore.delete(state);

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
  } catch (error: any) {
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

/**
 * DELETE /oauth/twitter/disconnect
 * Disconnect Twitter account
 */
router.delete("/twitter/disconnect", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Remove connection from database
    await oauthService.disconnectPlatform(userId, "TWITTER");

    return res.json({
      success: true,
      message: "Twitter account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Twitter:", error);
    return res.status(500).json({
      error: "Failed to disconnect Twitter account",
    });
  }
});

/**
 *
 *
 *
 *
 *
 * TWITTER OAUTH Handler
 *
 *
 *
 *
 *
 *
 */

/**
 * GET /oauth/connect/tiktok
 * Initiate TikTok OAuth flow
 */
router.get("/connect/tiktok", authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  // Generate CSRF state that includes userId for security and persistence
  const csrfState = `${userId}.${Math.random().toString(36).substring(2)}`;

  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.BACKEND_URL || "http://localhost:5628"}/api/oauth/tiktok/callback`;
  const scope = "user.info.profile,user.info.stats,video.list"; // Use your sandbox scopes

  // Build TikTok authorization URL following their official format
  let authUrl = "https://www.tiktok.com/v2/auth/authorize/";
  authUrl += `?client_key=${encodeURIComponent(clientKey!)}`;
  authUrl += `&scope=${encodeURIComponent(scope)}`;
  authUrl += "&response_type=code";
  authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  authUrl += `&state=${csrfState}`;

  return res.status(200).json({
    authUrl,
    message: "TikTok authorization URL generated successfully",
  });
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
 * POST /oauth/facebook/token
 * Handle NextAuth Facebook token and store connection
 */
router.post("/facebook/token", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, providerAccountId, userProfile } = req.body;
    const userId = (req as any).user.id;

    if (!accessToken || !providerAccountId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "accessToken and providerAccountId are required",
      });
    }

    // Verify the Facebook token and get user info
    try {
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
      const userData = (await userResponse.json()) as any;

      if (!userData.id || userData.id !== providerAccountId) {
        return res.status(400).json({
          error: "Invalid token",
          message: "Facebook token validation failed",
        });
      }

      // Store the Facebook connection
      const oauthData = {
        platform: Platform.FACEBOOK,
        platformUserId: userData.id,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        profile: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          ...userProfile,
        },
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

/*** Get user's connected platforms */
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

export { router as oauthRoutes };
