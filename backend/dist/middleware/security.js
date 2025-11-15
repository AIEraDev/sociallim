"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = exports.validateContentType = exports.securityLogger = exports.validateApiKey = exports.requestTimeout = exports.ipFilter = exports.requestSizeLimit = exports.helmetOptions = exports.corsOptions = void 0;
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = require("../config/environment");
exports.corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [environment_1.config.frontendUrl, "http://localhost:5628", "http://localhost:5628", "https://localhost:5628", "https://localhost:5628"];
    if (environment_1.config.env === "development") {
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
  maxAge: 86400,
};
exports.helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", environment_1.config.frontendUrl].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: environment_1.config.env === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
};
const requestSizeLimit = (maxSize = "10mb") => {
  return (req, res, next) => {
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
exports.requestSizeLimit = requestSizeLimit;
const ipFilter = (options) => {
  return (req, res, next) => {
    const { whitelist, blacklist, trustProxy = true } = options;
    const ip = trustProxy && req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.connection.remoteAddress || req.ip || "";
    if (blacklist && blacklist.includes(ip)) {
      console.warn(`Blocked IP from blacklist: ${ip}`);
      res.status(403).json({
        error: "Access denied",
        message: "Your IP address has been blocked",
      });
      return;
    }
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
exports.ipFilter = ipFilter;
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: "Request timeout",
          message: "Request took too long to process",
          timeout: timeoutMs,
        });
      }
    }, timeoutMs);
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));
    next();
  };
};
exports.requestTimeout = requestTimeout;
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({
      error: "API key required",
      message: "API key must be provided in X-API-Key header",
    });
    return;
  }
  if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
    res.status(401).json({
      error: "Invalid API key format",
      message: "API key format is invalid",
    });
    return;
  }
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
exports.validateApiKey = validateApiKey;
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const suspiciousPatterns = [/\.\./, /<script/i, /union.*select/i, /javascript:/i, /data:/i, /vbscript:/i];
  const url = req.url;
  const userAgent = req.get("User-Agent") || "";
  const referer = req.get("Referer") || "";
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
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";
    console[logLevel]("Request completed:", {
      ip: req.ip,
      method: req.method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
  });
  next();
};
exports.securityLogger = securityLogger;
const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    if (req.method === "GET" || req.method === "DELETE") {
      return next();
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
exports.validateContentType = validateContentType;
function parseSize(size) {
  const units = {
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
const setupSecurity = () => {
  return [(0, helmet_1.default)(exports.helmetOptions), (0, cors_1.default)(exports.corsOptions), exports.securityLogger, (0, exports.requestTimeout)(30000), (0, exports.requestSizeLimit)("10mb"), (0, exports.validateContentType)(["application/json", "multipart/form-data", "application/x-www-form-urlencoded"])];
};
exports.setupSecurity = setupSecurity;
//# sourceMappingURL=security.js.map
