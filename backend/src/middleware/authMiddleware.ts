import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { AuthService } from "../services/authService";
import { CookieUtils } from "../utils/cookieUtils";

// Define user type without password
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = CookieUtils.getAuthToken(req);

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

    // Verify token and get user
    const user = await AuthService.verifyToken(token);

    if (!user) {
      res.status(401).json({
        error: "Access denied",
        message: "Invalid or expired token",
      });
      return;
    }

    // Remove password from user object before attaching to request
    const { password: _, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Authentication failed",
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = CookieUtils.getAuthToken(req);

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    }

    if (token) {
      const user = await AuthService.verifyToken(token);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Continue without user for optional auth
    next();
  }
};

/**
 * Middleware to ensure user is authenticated
 * Use this after authenticateToken to ensure req.user exists
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Access denied",
      message: "Authentication required",
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user owns a resource
 * Compares req.user.id with req.params.userId or req.body.userId
 */
export const requireOwnership = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    // Clean up expired entries
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
