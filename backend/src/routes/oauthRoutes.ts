import { Router, Request, Response } from "express";
import { oauthService } from "../services/oauthService";
import { authenticateToken } from "../middleware/authMiddleware";
import { Platform } from "@prisma/client";
import { encrypt } from "../utils/encryption";
import { socialMediaServiceFactory } from "../services/socialMedia/socialMediaServiceFactory";
import { twitterService } from "../services/socialMedia/twitterService";
import { metaService } from "../services/socialMedia/metaService";
import { generatePKCEChallenge } from "../utils/pkce";
import { PKCEStore } from "../utils/pkceStore";
import crypto from "crypto";

const router = Router();

/*********************************************************  TWITTER OAUTH *********************************************************/
/*** GET /oauth/twitter/authorize - Generate Twitter OAuth URL with PKCE ***/
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

/*** POST /oauth/twitter/callback - Handle Twitter OAuth callback ***/
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

/*********************************************************  TWITTER OAUTH *********************************************************/

/*********************************************************  META OAUTH *********************************************************/

/*** GET /oauth/connect/tiktok - Initiate TikTok OAuth flow ***/
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

/*** TikTok OAuth callback - Following TikTok's official recommendation ***/
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

/*********************************************************  META OAUTH *********************************************************/

/*** GET /oauth/meta/authorize - Generate Facebook authorization URL ***/
router.get("/meta/authorize", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString("base64url");

    // Generate auth URL
    const authUrl = metaService.instance.generateAuthUrl(state);

    // Store state (no PKCE needed for Facebook OAuth 2.0)
    PKCEStore.set(state, {
      codeVerifier: "", // Not used for Facebook
      state,
      userId,
    });

    return res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error generating Facebook auth URL:", error);
    return res.status(500).json({
      error: "Failed to generate authorization URL",
    });
  }
});

/*** POST /oauth/meta/callback - Complete Facebook OAuth flow (from frontend) ***/
router.post("/meta/callback", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const userId = (req as any).user.id;

    if (!code || !state) {
      return res.status(400).json({
        error: "Missing code or state parameter",
      });
    }

    // Retrieve stored state data
    const stateData = PKCEStore.get(state);

    if (!stateData) {
      return res.status(400).json({
        error: "Invalid or expired state parameter",
      });
    }

    // Verify user matches
    if (stateData.userId !== userId) {
      return res.status(403).json({
        error: "User mismatch",
      });
    }

    // Exchange code for short-lived token
    const shortLivedToken = await metaService.instance.exchangeCodeForToken(code);

    // Exchange for long-lived token (60 days)
    const longLivedToken = await metaService.instance.getLongLivedToken(shortLivedToken.access_token);

    // Fetch user info
    const metaUser = await metaService.instance.fetchUserInfo(longLivedToken.access_token);

    // Get user's Facebook Pages
    const pages = await metaService.instance.getUserPages(longLivedToken.access_token);

    // Get Instagram accounts connected to Pages
    const instagramAccounts = await metaService.instance.getAllInstagramAccounts(longLivedToken.access_token);

    // Store Meta connection (handles both Facebook and Instagram)
    await oauthService.storeConnection(userId, {
      platform: Platform.FACEBOOK, // Still uses Facebook platform internally
      platformUserId: metaUser.id,
      accessToken: encrypt(longLivedToken.access_token),
      refreshToken: null, // Facebook doesn't use refresh tokens
      profile: {
        id: metaUser.id,
        name: metaUser.name,
        email: metaUser.email,
        picture: metaUser.picture?.data?.url,
        pages: pages,
      },
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    });

    // Store Instagram connections (one per page with Instagram)
    for (const { page, instagram } of instagramAccounts) {
      await oauthService.storeConnection(userId, {
        platform: Platform.INSTAGRAM,
        platformUserId: instagram.id,
        accessToken: encrypt(page.access_token), // Use page access token
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

    // Clean up state
    PKCEStore.delete(state);

    return res.json({
      success: true,
      message: "Meta account connected successfully",
      data: {
        facebook: {
          id: metaUser.id,
          name: metaUser.name,
          email: metaUser.email,
          picture: metaUser.picture?.data?.url,
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
  } catch (error: any) {
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
/*********************************************************  META OAUTH *********************************************************/

export { router as oauthRoutes };
