"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.passport = void 0;
const passport_1 = __importDefault(require("passport"));
exports.passport = passport_1.default;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_twitter_1 = require("passport-twitter");
const passport_oauth2_1 = require("passport-oauth2");
const encryption_1 = require("../utils/encryption");
const client_1 = require("@prisma/client");
const CALLBACK_URLS = {
  youtube: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/youtube/callback`,
  instagram: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/instagram/callback`,
  twitter: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/twitter/callback`,
  tiktok: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/tiktok/callback`,
};
if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
  passport_1.default.use(
    "youtube",
    new passport_google_oauth20_1.Strategy(
      {
        clientID: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.youtube,
        scope: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/userinfo.profile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthData = {
            platform: client_1.Platform.YOUTUBE,
            platformUserId: profile.id,
            accessToken: (0, encryption_1.encrypt)(accessToken),
            refreshToken: refreshToken ? (0, encryption_1.encrypt)(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          };
          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}
if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
  passport_1.default.use(
    "instagram",
    new passport_oauth2_1.Strategy(
      {
        authorizationURL: "https://api.instagram.com/oauth/authorize",
        tokenURL: "https://api.instagram.com/oauth/access_token",
        clientID: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.instagram,
        scope: ["user_profile", "user_media"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthData = {
            platform: client_1.Platform.INSTAGRAM,
            platformUserId: profile?.id || "unknown",
            accessToken: (0, encryption_1.encrypt)(accessToken),
            refreshToken: refreshToken ? (0, encryption_1.encrypt)(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          };
          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport_1.default.use(
    "twitter",
    new passport_twitter_1.Strategy(
      {
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.twitter,
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          const oauthData = {
            platform: client_1.Platform.TWITTER,
            platformUserId: profile.id,
            accessToken: (0, encryption_1.encrypt)(token),
            refreshToken: tokenSecret ? (0, encryption_1.encrypt)(tokenSecret) : null,
            profile: profile,
            tokenExpiresAt: null,
          };
          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}
if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
  passport_1.default.use(
    "tiktok",
    new passport_oauth2_1.Strategy(
      {
        authorizationURL: "https://www.tiktok.com/auth/authorize/",
        tokenURL: "https://open-api.tiktok.com/oauth/access_token/",
        clientID: process.env.TIKTOK_CLIENT_ID,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.tiktok,
        scope: ["user.info.basic", "video.list"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthData = {
            platform: client_1.Platform.TIKTOK,
            platformUserId: profile?.id || "unknown",
            accessToken: (0, encryption_1.encrypt)(accessToken),
            refreshToken: refreshToken ? (0, encryption_1.encrypt)(refreshToken) : null,
            profile: profile,
            tokenExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          };
          return done(null, oauthData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}
passport_1.default.serializeUser((user, done) => {
  done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
  done(null, user);
});
//# sourceMappingURL=oauth.js.map
