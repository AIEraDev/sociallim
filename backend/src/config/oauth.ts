import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import axios from "axios";
import prisma from "./prisma";
import { encrypt } from "../utils/encryption";
import { Platform } from "@prisma/client";

// OAuth callback URLs
const CALLBACK_URLS = {
  youtube: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/youtube/callback`,
  instagram: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/instagram/callback`,
  twitter: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/twitter/callback`,
  tiktok: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/tiktok/callback`,
  facebook: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/facebook/callback`,
};

/**
 * Configure YouTube OAuth Strategy (using Google OAuth for YouTube API access)
 */
if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
  passport.use(
    "youtube",
    new GoogleStrategy(
      {
        clientID: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.youtube,
        scope: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/userinfo.profile"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Store the tokens and profile info for later use
          const oauthData = {
            platform: Platform.YOUTUBE,
            platformUserId: profile.id,
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
          };

          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Configure Instagram OAuth Strategy
 */
if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
  passport.use(
    "instagram",
    new OAuth2Strategy(
      {
        authorizationURL: "https://api.instagram.com/oauth/authorize",
        tokenURL: "https://api.instagram.com/oauth/access_token",
        clientID: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.instagram,
        scope: ["user_profile", "user_media"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // For Instagram, we need to get user info separately
          const oauthData = {
            platform: Platform.INSTAGRAM,
            platformUserId: profile?.id || "unknown",
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
          };

          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Configure Twitter OAuth Strategy
 */
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport.use(
    "twitter",
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.twitter,
        includeEmail: true,
      },
      async (token: string, tokenSecret: string, profile: any, done: any) => {
        try {
          const oauthData = {
            platform: Platform.TWITTER,
            platformUserId: profile.id,
            accessToken: encrypt(token),
            refreshToken: tokenSecret ? encrypt(tokenSecret) : null,
            profile: profile,
            tokenExpiresAt: null, // Twitter tokens don't expire
          };

          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Configure Facebook OAuth Strategy
 */
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(
    "facebook",
    new OAuth2Strategy(
      {
        authorizationURL: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenURL: "https://graph.facebook.com/v18.0/oauth/access_token",
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.facebook,
        scope: ["public_profile", "email", "pages_read_engagement", "pages_show_list"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // For Facebook, we need to get user info separately
          const oauthData = {
            platform: Platform.FACEBOOK,
            platformUserId: profile?.id || "unknown",
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 2 * 3600 * 1000), // 2 hours from now
          };

          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Configure TikTok OAuth Strategy
 * TikTok uses Login Kit Web with specific parameter requirements
 */
if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
  passport.use(
    "tiktok",
    new OAuth2Strategy(
      {
        authorizationURL: "https://www.tiktok.com/v2/auth/authorize/",
        tokenURL: "https://open.tiktokapis.com/v2/oauth/token/",
        clientID: process.env.TIKTOK_CLIENT_ID,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.tiktok,
        scope: ["user.info.profile", "user.info.stats", "video.list"],
        customHeaders: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Get user info from TikTok API since profile might be empty
          let userInfo = profile;
          if (!userInfo || !userInfo.id) {
            try {
              const userResponse = await axios.post(
                "https://open.tiktokapis.com/v2/user/info/",
                {
                  fields: "open_id,union_id,avatar_url,display_name,bio_description,is_verified,profile_deep_link,follower_count,following_count,likes_count,video_count",
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              userInfo = userResponse.data.data?.user || {};
            } catch (userError) {
              console.warn("Failed to fetch TikTok user info:", userError);
              userInfo = { id: "unknown" };
            }
          }

          const oauthData = {
            platform: Platform.TIKTOK,
            platformUserId: userInfo.open_id || userInfo.id || "unknown",
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            profile: userInfo,
            tokenExpiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24 hours from now
          };

          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Serialize user for session
 */
passport.serializeUser((user: any, done) => {
  done(null, user);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export { passport };
