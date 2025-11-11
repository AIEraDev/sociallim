import { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "../config/environment";

/**
 * Security middleware configuration
 */

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [config.frontendUrl, "http://localhost:3000", "http://localhost:3001", "https://localhost:3000", "https://localhost:3001"];

    // In development, allow all localhost origins
    if (config.env === "development") {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-Correlation-ID", "X-API-Key"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  maxAge: 86400, // 24 hours
};

// Helmet configuration for security headers
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", config.frontendUrl].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.env === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API server
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" as const },
  xssFilter: true,
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: string = "10mb"): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get("content-length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        res.status(413).json({
          error: "Payload too large",
          message: `Request size exceeds maximum allowed size of ${maxSize}`,
          maxSize,
        });
        return;
      }
    }

    next();
  };
};

/**
 * IP whitelist/blacklist middleware
 */
export const ipFilter = (options: { whitelist?: string[]; blacklist?: string[]; trustProxy?: boolean }): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { whitelist, blacklist, trustProxy = true } = options;

    // Get real IP address
    const ip = trustProxy && req.headers["x-forwarded-for"] ? (req.headers["x-forwarded-for"] as string).split(",")[0].trim() : req.connection.remoteAddress || req.ip || "";

    // Check blacklist first
    if (blacklist && blacklist.includes(ip)) {
      console.warn(`Blocked IP from blacklist: ${ip}`);
      res.status(403).json({
        error: "Access denied",
        message: "Your IP address has been blocked",
      });
      return;
    }

    // Check whitelist if configured
    if (whitelist && whitelist.length > 0 && !whitelist.includes(ip)) {
      console.warn(`Blocked IP not in whitelist: ${ip}`);
      res.status(403).json({
        error: "Access denied",
        message: "Your IP address is not authorized",
      });
      return;
    }

    next();
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: "Request timeout",
          message: "Request took too long to process",
          timeout: timeoutMs,
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));

    next();
  };
};

/**
 * API key validation middleware
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    res.status(401).json({
      error: "API key required",
      message: "API key must be provided in X-API-Key header",
    });
    return;
  }

  // Validate API key format (basic validation)
  if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
    res.status(401).json({
      error: "Invalid API key format",
      message: "API key format is invalid",
    });
    return;
  }

  // In a real application, you would validate against a database
  // For now, we'll just check against environment variable
  const validApiKey = process.env.API_KEY;

  if (validApiKey && apiKey !== validApiKey) {
    console.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
    res.status(401).json({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
    return;
  }

  next();
};

/**
 * Request logging middleware for security monitoring
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /vbscript:/i, // VBScript protocol
  ];

  const url = req.url;
  const userAgent = req.get("User-Agent") || "";
  const referer = req.get("Referer") || "";

  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url) || pattern.test(userAgent) || pattern.test(referer));

  if (isSuspicious) {
    console.warn("Suspicious request detected:", {
      ip: req.ip,
      method: req.method,
      url,
      userAgent,
      referer,
      timestamp: new Date().toISOString(),
    });
  }

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";

    console[logLevel]("Request completed:", {
      ip: req.ip,
      method: req.method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: userAgent.substring(0, 100), // Truncate long user agents
      timestamp: new Date().toISOString(),
    });
    console.log("======================================== REQUEST DIVIDER ========================================");
  });

  next();
};

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "DELETE") {
      return next(); // Skip for methods without body
    }

    const contentType = req.get("Content-Type");

    if (!contentType) {
      res.status(400).json({
        error: "Content-Type required",
        message: "Content-Type header is required",
        allowedTypes,
      });
      return;
    }

    const isAllowed = allowedTypes.some((type) => contentType.toLowerCase().includes(type.toLowerCase()));

    if (!isAllowed) {
      res.status(415).json({
        error: "Unsupported Media Type",
        message: `Content-Type '${contentType}' is not supported`,
        allowedTypes,
      });
      return;
    }

    next();
  };
};

/**
 * Utility function to parse size strings (e.g., "10mb", "1gb")
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);

  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const [, value, unit = "b"] = match;
  const multiplier = units[unit];

  if (!multiplier) {
    throw new Error(`Unknown size unit: ${unit}`);
  }

  return parseFloat(value) * multiplier;
}

/**
 * Combined security middleware setup
 */
export const setupSecurity = () => {
  return [helmet(helmetOptions), cors(corsOptions), securityLogger, requestTimeout(30000), requestSizeLimit("10mb"), validateContentType(["application/json", "multipart/form-data", "application/x-www-form-urlencoded"])];
};
