"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.requireOwnership = exports.requireAuth = exports.optionalAuth = exports.authenticateToken = void 0;
const authService_1 = require("../services/authService");
const cookieUtils_1 = require("../utils/cookieUtils");
const authenticateToken = async (req, res, next) => {
    try {
        let token = cookieUtils_1.CookieUtils.getAuthToken(req);
        if (!token) {
            const authHeader = req.headers.authorization;
            token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        }
        if (!token) {
            res.status(401).json({
                error: "Access denied",
                message: "No token provided",
            });
            return;
        }
        const user = await authService_1.AuthService.verifyToken(token);
        if (!user) {
            res.status(401).json({
                error: "Access denied",
                message: "Invalid or expired token",
            });
            return;
        }
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
    }
    catch (error) {
        console.error("Authentication middleware error:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Authentication failed",
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        let token = cookieUtils_1.CookieUtils.getAuthToken(req);
        if (!token) {
            const authHeader = req.headers.authorization;
            token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        }
        if (token) {
            const user = await authService_1.AuthService.verifyToken(token);
            if (user) {
                const { password: _, ...userWithoutPassword } = user;
                req.user = userWithoutPassword;
            }
        }
        next();
    }
    catch (error) {
        console.error("Optional auth middleware error:", error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: "Access denied",
            message: "Authentication required",
        });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
const requireOwnership = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: "Access denied",
            message: "Authentication required",
        });
        return;
    }
    const resourceUserId = req.params.userId || req.body.userId;
    if (req.user.id !== resourceUserId) {
        res.status(403).json({
            error: "Access denied",
            message: "You can only access your own resources",
        });
        return;
    }
    next();
};
exports.requireOwnership = requireOwnership;
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress || "unknown";
        const now = Date.now();
        for (const [key, value] of attempts.entries()) {
            if (now > value.resetTime) {
                attempts.delete(key);
            }
        }
        const clientAttempts = attempts.get(clientId);
        if (!clientAttempts) {
            attempts.set(clientId, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (clientAttempts.count >= maxAttempts) {
            res.status(429).json({
                error: "Too many requests",
                message: `Too many authentication attempts. Try again in ${Math.ceil((clientAttempts.resetTime - now) / 60000)} minutes.`,
                retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000),
            });
            return;
        }
        clientAttempts.count++;
        next();
    };
};
exports.authRateLimit = authRateLimit;
//# sourceMappingURL=authMiddleware.js.map