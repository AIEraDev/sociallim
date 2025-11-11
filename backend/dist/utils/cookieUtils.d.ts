import { Response, Request } from "express";
export interface CookieOptions {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    domain?: string;
    path?: string;
}
export declare class CookieUtils {
    static readonly AUTH_TOKEN_COOKIE = "auth_token";
    static readonly REFRESH_TOKEN_COOKIE = "refresh_token";
    static readonly CSRF_TOKEN_COOKIE = "csrf_token";
    private static getDefaultOptions;
    static setAuthToken(res: Response, token: string, maxAge?: number): void;
    static setLimitedAuthToken(res: Response, token: string, maxAge?: number): void;
    static setRefreshToken(res: Response, token: string, maxAge?: number): void;
    static setCSRFToken(res: Response, token: string): void;
    static getAuthToken(req: Request): string | null;
    static getRefreshToken(req: Request): string | null;
    static getCSRFToken(req: Request): string | null;
    static clearAuthCookies(res: Response): void;
    static generateCSRFToken(): string;
    static validateCSRFToken(req: Request, providedToken: string): boolean;
    static setAuthSession(res: Response, authToken: string, refreshToken?: string, tokenType?: "full" | "limited"): void;
    static clearAuthSession(res: Response): void;
}
//# sourceMappingURL=cookieUtils.d.ts.map