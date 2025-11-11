import { Request, Response, NextFunction } from "express";
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: (maxAttempts?: number, windowMs?: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare const analysisRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const exportRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createUserRateLimit: (maxRequests: number, windowMs: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare const createTieredRateLimit: (getLimits: (req: Request) => {
    max: number;
    windowMs: number;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare class SlidingWindowRateLimiter {
    private windowSize;
    private maxRequests;
    private requests;
    constructor(windowSize: number, maxRequests: number);
    isAllowed(key: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cleanup(): void;
}
export declare const createBurstProtection: (shortWindow: {
    max: number;
    windowMs: number;
}, longWindow: {
    max: number;
    windowMs: number;
}) => import("express-rate-limit").RateLimitRequestHandler[];
//# sourceMappingURL=rateLimiter.d.ts.map