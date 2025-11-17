"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieUtils = void 0;
const environment_1 = require("../config/environment");
class CookieUtils {
    static getDefaultOptions() {
        const isProduction = environment_1.config.env === "production";
        console.log("NODE ENVIRONMENT: ", isProduction);
        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        };
    }
    static setAuthToken(res, token, maxAge = 7 * 24 * 60 * 60 * 1000) {
        const options = {
            ...this.getDefaultOptions(),
            maxAge,
        };
        res.cookie(this.AUTH_TOKEN_COOKIE, token, options);
    }
    static setLimitedAuthToken(res, token, maxAge = 24 * 60 * 60 * 1000) {
        const options = {
            ...this.getDefaultOptions(),
            maxAge,
        };
        res.cookie(this.AUTH_TOKEN_COOKIE, token, options);
    }
    static setRefreshToken(res, token, maxAge = 30 * 24 * 60 * 60 * 1000) {
        const options = {
            ...this.getDefaultOptions(),
            maxAge,
            sameSite: "strict",
        };
        res.cookie(this.REFRESH_TOKEN_COOKIE, token, options);
    }
    static setCSRFToken(res, token) {
        const options = {
            ...this.getDefaultOptions(),
            httpOnly: false,
            maxAge: 24 * 60 * 60 * 1000,
        };
        res.cookie(this.CSRF_TOKEN_COOKIE, token, options);
    }
    static getAuthToken(req) {
        return req.cookies?.[this.AUTH_TOKEN_COOKIE] || null;
    }
    static getRefreshToken(req) {
        return req.cookies?.[this.REFRESH_TOKEN_COOKIE] || null;
    }
    static getCSRFToken(req) {
        return req.cookies?.[this.CSRF_TOKEN_COOKIE] || null;
    }
    static clearAuthCookies(res) {
        const clearOptions = {
            ...this.getDefaultOptions(),
            maxAge: 0,
        };
        res.clearCookie(this.AUTH_TOKEN_COOKIE, clearOptions);
        res.clearCookie(this.REFRESH_TOKEN_COOKIE, clearOptions);
        res.clearCookie(this.CSRF_TOKEN_COOKIE, clearOptions);
    }
    static generateCSRFToken() {
        return require("crypto").randomBytes(32).toString("hex");
    }
    static validateCSRFToken(req, providedToken) {
        const cookieToken = this.getCSRFToken(req);
        return cookieToken === providedToken;
    }
    static setAuthSession(res, authToken, refreshToken, tokenType = "full") {
        if (tokenType === "limited") {
            this.setLimitedAuthToken(res, authToken);
        }
        else {
            this.setAuthToken(res, authToken);
        }
        if (refreshToken) {
            this.setRefreshToken(res, refreshToken);
        }
        const csrfToken = this.generateCSRFToken();
        this.setCSRFToken(res, csrfToken);
    }
    static clearAuthSession(res) {
        this.clearAuthCookies(res);
    }
}
exports.CookieUtils = CookieUtils;
CookieUtils.AUTH_TOKEN_COOKIE = "auth_token";
CookieUtils.REFRESH_TOKEN_COOKIE = "refresh_token";
CookieUtils.CSRF_TOKEN_COOKIE = "csrf_token";
//# sourceMappingURL=cookieUtils.js.map