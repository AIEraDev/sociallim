"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passport = void 0;
const passport_1 = __importDefault(require("passport"));
exports.passport = passport_1.default;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_twitter_1 = require("passport-twitter");
const passport_oauth2_1 = require("passport-oauth2");
const axios_1 = __importDefault(require("axios"));
const encryption_1 = require("../utils/encryption");
const client_1 = require("@prisma/client");
const CALLBACK_URLS = {
    youtube: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/youtube/callback`,
    instagram: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/instagram/callback`,
    twitter: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/twitter/callback`,
    tiktok: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/tiktok/callback`,
    facebook: `${process.env.BACKEND_URL || "http://localhost:5628"}/auth/facebook/callback`,
};
if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
    passport_1.default.use("youtube", new passport_google_oauth20_1.Strategy({
        clientID: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.youtube,
        scope: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/userinfo.profile"],
    }, async (accessToken, refreshToken, profile, done) => {
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
        }
        catch (error) {
            return done(error, null);
        }
    }));
}
if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
    passport_1.default.use("instagram", new passport_oauth2_1.Strategy({
        authorizationURL: "https://api.instagram.com/oauth/authorize",
        tokenURL: "https://api.instagram.com/oauth/access_token",
        clientID: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.instagram,
        scope: ["user_profile", "user_media"],
    }, async (accessToken, refreshToken, profile, done) => {
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
        }
        catch (error) {
            return done(error, null);
        }
    }));
}
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    passport_1.default.use("twitter", new passport_twitter_1.Strategy({
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.twitter,
        includeEmail: true,
    }, async (token, tokenSecret, profile, done) => {
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
        }
        catch (error) {
            return done(error, null);
        }
    }));
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    passport_1.default.use("facebook", new passport_oauth2_1.Strategy({
        authorizationURL: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenURL: "https://graph.facebook.com/v18.0/oauth/access_token",
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.facebook,
        scope: ["public_profile", "email", "pages_read_engagement", "pages_show_list"],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const oauthData = {
                platform: client_1.Platform.FACEBOOK,
                platformUserId: profile?.id || "unknown",
                accessToken: (0, encryption_1.encrypt)(accessToken),
                refreshToken: refreshToken ? (0, encryption_1.encrypt)(refreshToken) : null,
                profile: profile,
                tokenExpiresAt: new Date(Date.now() + 2 * 3600 * 1000),
            };
            return done(null, oauthData);
        }
        catch (error) {
            return done(error, null);
        }
    }));
}
if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
    passport_1.default.use("tiktok", new passport_oauth2_1.Strategy({
        authorizationURL: "https://www.tiktok.com/v2/auth/authorize/",
        tokenURL: "https://open.tiktokapis.com/v2/oauth/token/",
        clientID: process.env.TIKTOK_CLIENT_ID,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET,
        callbackURL: CALLBACK_URLS.tiktok,
        scope: ["user.info.profile", "user.info.stats", "video.list"],
        customHeaders: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let userInfo = profile;
            if (!userInfo || !userInfo.id) {
                try {
                    const userResponse = await axios_1.default.post("https://open.tiktokapis.com/v2/user/info/", {
                        fields: "open_id,union_id,avatar_url,display_name,bio_description,is_verified,profile_deep_link,follower_count,following_count,likes_count,video_count",
                    }, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    });
                    userInfo = userResponse.data.data?.user || {};
                }
                catch (userError) {
                    console.warn("Failed to fetch TikTok user info:", userError);
                    userInfo = { id: "unknown" };
                }
            }
            const oauthData = {
                platform: client_1.Platform.TIKTOK,
                platformUserId: userInfo.open_id || userInfo.id || "unknown",
                accessToken: (0, encryption_1.encrypt)(accessToken),
                refreshToken: refreshToken ? (0, encryption_1.encrypt)(refreshToken) : null,
                profile: userInfo,
                tokenExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
            };
            return done(null, oauthData);
        }
        catch (error) {
            return done(error, null);
        }
    }));
}
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
//# sourceMappingURL=oauth.js.map