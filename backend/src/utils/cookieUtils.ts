import { Response, Request } from "express";
import { config } from "../config/environment";

/**
 * Secure Cookie Utilities
 *
 * Handles secure HTTP-only cookies with proper SameSite settings
 */

export interface CookieOptions {
  maxAge?: number; // in milliseconds
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  domain?: string;
  path?: string;
}

export class CookieUtils {
  // Cookie names
  static readonly AUTH_TOKEN_COOKIE = "auth_token";
  static readonly REFRESH_TOKEN_COOKIE = "refresh_token";
  static readonly CSRF_TOKEN_COOKIE = "csrf_token";

  /**
   * Get default secure cookie options
   */
  private static getDefaultOptions(): CookieOptions {
    const isProduction = config.env === "production";
    // const isCrossOrigin = process.env.FRONTEND_URL?.includes("ngrok") || process.env.FRONTEND_URL?.includes("https");

    console.log("NODE ENVIRONMENT: ", isProduction);

    return {
      httpOnly: true,
      secure: isProduction, // HTTPS required for cross-origin or production
      sameSite: isProduction ? "none" : "lax", // None for cross-origin, lax for same-origin
      path: "/",
      // domain: isProduction ? ".yourdomain.com" : undefined, // Set domain in production
    };
  }

  /**
   * Set authentication token cookie
   */
  static setAuthToken(res: Response, token: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const options: CookieOptions = {
      ...this.getDefaultOptions(),
      maxAge,
    };

    res.cookie(this.AUTH_TOKEN_COOKIE, token, options);
  }

  /**
   * Set limited access token cookie (shorter expiration)
   */
  static setLimitedAuthToken(res: Response, token: string, maxAge: number = 24 * 60 * 60 * 1000): void {
    const options: CookieOptions = {
      ...this.getDefaultOptions(),
      maxAge,
    };

    res.cookie(this.AUTH_TOKEN_COOKIE, token, options);
  }

  /**
   * Set refresh token cookie (longer expiration, more secure)
   */
  static setRefreshToken(res: Response, token: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const options: CookieOptions = {
      ...this.getDefaultOptions(),
      maxAge,
      // Refresh tokens are even more sensitive
      sameSite: "strict",
    };

    res.cookie(this.REFRESH_TOKEN_COOKIE, token, options);
  }

  /**
   * Set CSRF token cookie (readable by JavaScript for CSRF protection)
   */
  static setCSRFToken(res: Response, token: string): void {
    const options: CookieOptions = {
      ...this.getDefaultOptions(),
      httpOnly: false, // Needs to be readable by JavaScript
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    res.cookie(this.CSRF_TOKEN_COOKIE, token, options);
  }

  /**
   * Get authentication token from cookies
   */
  static getAuthToken(req: Request): string | null {
    return req.cookies?.[this.AUTH_TOKEN_COOKIE] || null;
  }

  /**
   * Get refresh token from cookies
   */
  static getRefreshToken(req: Request): string | null {
    return req.cookies?.[this.REFRESH_TOKEN_COOKIE] || null;
  }

  /**
   * Get CSRF token from cookies
   */
  static getCSRFToken(req: Request): string | null {
    return req.cookies?.[this.CSRF_TOKEN_COOKIE] || null;
  }

  /**
   * Clear authentication cookies
   */
  static clearAuthCookies(res: Response): void {
    const clearOptions: CookieOptions = {
      ...this.getDefaultOptions(),
      maxAge: 0,
    };

    res.clearCookie(this.AUTH_TOKEN_COOKIE, clearOptions);
    res.clearCookie(this.REFRESH_TOKEN_COOKIE, clearOptions);
    res.clearCookie(this.CSRF_TOKEN_COOKIE, clearOptions);
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return require("crypto").randomBytes(32).toString("hex");
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(req: Request, providedToken: string): boolean {
    const cookieToken = this.getCSRFToken(req);
    return cookieToken === providedToken;
  }

  /**
   * Set secure session cookies for authentication
   */
  static setAuthSession(res: Response, authToken: string, refreshToken?: string, tokenType: "full" | "limited" = "full"): void {
    // Set auth token with appropriate expiration
    if (tokenType === "limited") {
      this.setLimitedAuthToken(res, authToken);
    } else {
      this.setAuthToken(res, authToken);
    }

    // Set refresh token if provided
    if (refreshToken) {
      this.setRefreshToken(res, refreshToken);
    }

    // Set CSRF token for additional security
    const csrfToken = this.generateCSRFToken();
    this.setCSRFToken(res, csrfToken);
  }

  /**
   * Clear all authentication session cookies
   */
  static clearAuthSession(res: Response): void {
    this.clearAuthCookies(res);
  }
}
