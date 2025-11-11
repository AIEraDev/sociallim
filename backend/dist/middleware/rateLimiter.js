"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBurstProtection = exports.SlidingWindowRateLimiter = exports.createTieredRateLimit = exports.createUserRateLimit = exports.exportRateLimit = exports.uploadRateLimit = exports.analysisRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./errorHandler");
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        error: "Too many requests",
        message: "Too many requests from this IP, please try again later.",
        retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res) => {
        throw new errorHandler_1.RateLimitError("Too many requests from this IP, please try again later.", Math.ceil((15 * 60 * 1000) / 1000));
    },
});
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxAttempts,
        message: {
            error: "Too many authentication attempts",
            message: `Too many authentication attempts from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes.`,
            retryAfter: Math.ceil(windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        handler: (_req, _res) => {
            throw new errorHandler_1.RateLimitError(`Too many authentication attempts from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes.`, Math.ceil(windowMs / 1000));
        },
    });
};
exports.authRateLimit = authRateLimit;
exports.analysisRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: {
        error: "Analysis rate limit exceeded",
        message: "Too many analysis requests. Please wait before starting another analysis.",
        retryAfter: Math.ceil((60 * 60 * 1000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res) => {
        throw new errorHandler_1.RateLimitError("Too many analysis requests. Please wait before starting another analysis.", Math.ceil((60 * 60 * 1000) / 1000));
    },
});
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: "Upload rate limit exceeded",
        message: "Too many file uploads. Please wait before uploading again.",
        retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res) => {
        throw new errorHandler_1.RateLimitError("Too many file uploads. Please wait before uploading again.", Math.ceil((15 * 60 * 1000) / 1000));
    },
});
exports.exportRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        error: "Export rate limit exceeded",
        message: "Too many export requests. Please wait before requesting another export.",
        retryAfter: Math.ceil((10 * 60 * 1000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res) => {
        throw new errorHandler_1.RateLimitError("Too many export requests. Please wait before requesting another export.", Math.ceil((10 * 60 * 1000) / 1000));
    },
});
const createUserRateLimit = (maxRequests, windowMs) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        },
        message: {
            error: "User rate limit exceeded",
            message: "You have exceeded the rate limit for this action. Please wait before trying again.",
            retryAfter: Math.ceil(windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, _res) => {
            throw new errorHandler_1.RateLimitError("You have exceeded the rate limit for this action. Please wait before trying again.", Math.ceil(windowMs / 1000));
        },
    });
};
exports.createUserRateLimit = createUserRateLimit;
const createTieredRateLimit = (getLimits) => {
    return (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: (req) => getLimits(req).max,
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        },
        message: {
            error: "Rate limit exceeded",
            message: "You have exceeded your rate limit. Consider upgrading your plan for higher limits.",
            retryAfter: (req) => Math.ceil(getLimits(req).windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, _res) => {
            const limits = getLimits(req);
            throw new errorHandler_1.RateLimitError("You have exceeded your rate limit. Consider upgrading your plan for higher limits.", Math.ceil(limits.windowMs / 1000));
        },
    });
};
exports.createTieredRateLimit = createTieredRateLimit;
class SlidingWindowRateLimiter {
    constructor(windowSize, maxRequests) {
        this.requests = new Map();
        this.windowSize = windowSize;
        this.maxRequests = maxRequests;
    }
    async isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.windowSize;
        let requestTimes = this.requests.get(key) || [];
        requestTimes = requestTimes.filter((time) => time > windowStart);
        if (requestTimes.length >= this.maxRequests) {
            const oldestRequest = Math.min(...requestTimes);
            const resetTime = oldestRequest + this.windowSize;
            return {
                allowed: false,
                remaining: 0,
                resetTime,
            };
        }
        requestTimes.push(now);
        this.requests.set(key, requestTimes);
        return {
            allowed: true,
            remaining: this.maxRequests - requestTimes.length,
            resetTime: now + this.windowSize,
        };
    }
    middleware() {
        return async (req, res, next) => {
            const key = `rate_limit:${req.user?.id || req.ip}`;
            try {
                const result = await this.isAllowed(key);
                res.set({
                    "X-RateLimit-Limit": this.maxRequests.toString(),
                    "X-RateLimit-Remaining": result.remaining.toString(),
                    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
                });
                if (!result.allowed) {
                    throw new errorHandler_1.RateLimitError("Rate limit exceeded", Math.ceil((result.resetTime - Date.now()) / 1000));
                }
                next();
            }
            catch (error) {
                next(error);
            }
        };
    }
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.windowSize;
        for (const [key, requestTimes] of this.requests.entries()) {
            const filteredTimes = requestTimes.filter((time) => time > windowStart);
            if (filteredTimes.length === 0) {
                this.requests.delete(key);
            }
            else {
                this.requests.set(key, filteredTimes);
            }
        }
    }
}
exports.SlidingWindowRateLimiter = SlidingWindowRateLimiter;
const createBurstProtection = (shortWindow, longWindow) => {
    const shortLimiter = (0, express_rate_limit_1.default)({
        windowMs: shortWindow.windowMs,
        max: shortWindow.max,
        keyGenerator: (req) => `short:${req.user?.id || req.ip}`,
        skip: () => false,
        handler: () => {
            throw new errorHandler_1.RateLimitError("Too many requests in a short time. Please slow down.", Math.ceil(shortWindow.windowMs / 1000));
        },
    });
    const longLimiter = (0, express_rate_limit_1.default)({
        windowMs: longWindow.windowMs,
        max: longWindow.max,
        keyGenerator: (req) => `long:${req.user?.id || req.ip}`,
        skip: () => false,
        handler: () => {
            throw new errorHandler_1.RateLimitError("Daily rate limit exceeded. Please try again tomorrow.", Math.ceil(longWindow.windowMs / 1000));
        },
    });
    return [shortLimiter, longLimiter];
};
exports.createBurstProtection = createBurstProtection;
//# sourceMappingURL=rateLimiter.js.map