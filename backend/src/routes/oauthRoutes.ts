import { Router, Request, Response, NextFunction } from "express";
import { passport } from "../config/oauth";
import { oauthService } from "../services/oauthService";
import { authenticateToken } from "../middleware/authMiddleware";
import { Platform } from "@prisma/client";

const router = Router();

/**
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

  // Initiate OAuth flow
  return passport.authenticate(platform, {
    session: false,
    state: userId, // Pass user ID as state parameter
  })(req, res, next);
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
 * TikTok OAuth callback
 */
router.get("/tiktok/callback", passport.authenticate("tiktok", { session: false }), async (req: Request, res: Response) => {
  try {
    const oauthData = req.user as any;
    const userId = (req.query.state as string) || (req.session as any)?.userId;

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Missing user session`);
    }

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

export { router as oauthRoutes };
