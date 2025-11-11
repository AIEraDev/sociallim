import rateLimit from "express-rate-limit";
import { RateLimitError } from "./errorHandler";
import { Request, Response, NextFunction } from "express";

/**
 * Rate limiting configuration for different endpoint types
 * Using memory store for simplicity (suitable for single-instance deployments)
 * For multi-instance deployments, consider using a shared store like Redis
 */

// General API rate limit (using memory store)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000), // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError("Too many requests from this IP, please try again later.", Math.ceil((15 * 60 * 1000) / 1000));
  },
});

// Strict rate limit for authentication endpoints (using memory store)
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxAttempts,
    message: {
      error: "Too many authentication attempts",
      message: `Too many authentication attempts from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes.`,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (_req: Request, _res: Response) => {
      throw new RateLimitError(`Too many authentication attempts from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes.`, Math.ceil(windowMs / 1000));
    },
  });
};

// Rate limit for analysis endpoints (more restrictive due to AI API costs)
export const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 analysis requests per hour
  message: {
    error: "Analysis rate limit exceeded",
    message: "Too many analysis requests. Please wait before starting another analysis.",
    retryAfter: Math.ceil((60 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError("Too many analysis requests. Please wait before starting another analysis.", Math.ceil((60 * 60 * 1000) / 1000));
  },
});

// Rate limit for file upload endpoints
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per 15 minutes
  message: {
    error: "Upload rate limit exceeded",
    message: "Too many file uploads. Please wait before uploading again.",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError("Too many file uploads. Please wait before uploading again.", Math.ceil((15 * 60 * 1000) / 1000));
  },
});

// Rate limit for export endpoints
export const exportRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 exports per 10 minutes
  message: {
    error: "Export rate limit exceeded",
    message: "Too many export requests. Please wait before requesting another export.",
    retryAfter: Math.ceil((10 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError("Too many export requests. Please wait before requesting another export.", Math.ceil((10 * 60 * 1000) / 1000));
  },
});

// User-specific rate limiting (requires authentication)
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return (req as any).user?.id || req.ip;
    },
    message: {
      error: "User rate limit exceeded",
      message: "You have exceeded the rate limit for this action. Please wait before trying again.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response) => {
      throw new RateLimitError("You have exceeded the rate limit for this action. Please wait before trying again.", Math.ceil(windowMs / 1000));
    },
  });
};

// Dynamic rate limiting based on user tier/subscription
export const createTieredRateLimit = (getLimits: (req: Request) => { max: number; windowMs: number }) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // Default fallback
    max: (req: Request) => getLimits(req).max,
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip;
    },
    message: {
      error: "Rate limit exceeded",
      message: "You have exceeded your rate limit. Consider upgrading your plan for higher limits.",
      retryAfter: (req: Request) => Math.ceil(getLimits(req).windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, _res: Response) => {
      const limits = getLimits(req);
      throw new RateLimitError("You have exceeded your rate limit. Consider upgrading your plan for higher limits.", Math.ceil(limits.windowMs / 1000));
    },
  });
};

// Simple in-memory sliding window rate limiter for more precise control
export class SlidingWindowRateLimiter {
  private windowSize: number;
  private maxRequests: number;
  private requests: Map<string, number[]> = new Map();

  constructor(windowSize: number, maxRequests: number) {
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get or create request history for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old entries
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

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return {
      allowed: true,
      remaining: this.maxRequests - requestTimes.length,
      resetTime: now + this.windowSize,
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = `rate_limit:${(req as any).user?.id || req.ip}`;

      try {
        const result = await this.isAllowed(key);

        // Set rate limit headers
        res.set({
          "X-RateLimit-Limit": this.maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
        });

        if (!result.allowed) {
          throw new RateLimitError("Rate limit exceeded", Math.ceil((result.resetTime - Date.now()) / 1000));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    for (const [key, requestTimes] of this.requests.entries()) {
      const filteredTimes = requestTimes.filter((time) => time > windowStart);
      if (filteredTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filteredTimes);
      }
    }
  }
}

// Burst protection - allows short bursts but enforces longer-term limits
export const createBurstProtection = (shortWindow: { max: number; windowMs: number }, longWindow: { max: number; windowMs: number }) => {
  const shortLimiter = rateLimit({
    windowMs: shortWindow.windowMs,
    max: shortWindow.max,
    keyGenerator: (req: Request) => `short:${(req as any).user?.id || req.ip}`,
    skip: () => false,
    handler: () => {
      throw new RateLimitError("Too many requests in a short time. Please slow down.", Math.ceil(shortWindow.windowMs / 1000));
    },
  });

  const longLimiter = rateLimit({
    windowMs: longWindow.windowMs,
    max: longWindow.max,
    keyGenerator: (req: Request) => `long:${(req as any).user?.id || req.ip}`,
    skip: () => false,
    handler: () => {
      throw new RateLimitError("Daily rate limit exceeded. Please try again tomorrow.", Math.ceil(longWindow.windowMs / 1000));
    },
  });

  return [shortLimiter, longLimiter];
};
