import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import prisma from "./prisma";
import { encrypt } from "../utils/encryption";
import { Platform } from "@prisma/client";

// OAuth callback URLs
const CALLBACK_URLS = {
  youtube: `${process.env.BACKEND_URL || "http://localhost:3001"}/auth/youtube/callback`,
  instagram: `${process.env.BACKEND_URL || "http://localhost:3001"}/auth/instagram/callback`,
  twitter: `${process.env.BACKEND_URL || "http://localhost:3001"}/auth/twitter/callback`,
  tiktok: `${process.env.BACKEND_URL || "http://localhost:3001"}/auth/tiktok/callback`,
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
 * Configure TikTok OAuth Strategy
 */
if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
  passport.use(
    "tiktok",
    new OAuth2Strategy(
      {
        authorizationURL: "https://www.tiktok.com/auth/authorize/",
        tokenURL: "https://open-api.tiktok.com/oauth/access_token/",
        clientID: process.env.TIKTOK_CLIENT_ID,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.tiktok,
        scope: ["user.info.basic", "video.list"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const oauthData = {
            platform: Platform.TIKTOK,
            platformUserId: profile?.id || "unknown",
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            profile: profile,
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
