import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/environment";
import { AuthService } from "../services/authService";
import { CookieUtils } from "../utils/cookieUtils";

export interface LimitedAuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  tokenType: "limited";
  scope: string[];
}

declare global {
  namespace Express {
    interface Request {
      limitedUser?: LimitedAuthenticatedUser;
    }
  }
}

/**
 * Middleware to authenticate limited access tokens
 *
 * Allows unverified users to access certain endpoints with restricted permissions
 */
export const authenticateLimitedToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = CookieUtils.getAuthToken(req);

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    }

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Access token required",
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Check if this is a limited access token
    if (decoded.type !== "limited_access") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token type",
      });
      return;
    }

    // Verify session exists
    const session = await AuthService.getUserSession(decoded.userId);
    if (!session || session.token !== token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session",
      });
      return;
    }

    // Set limited user info
    req.limitedUser = {
      id: decoded.userId,
      email: decoded.email,
      emailVerified: decoded.emailVerified,
      tokenType: "limited",
      scope: decoded.scope || [],
    };

    next();
  } catch (error) {
    console.error("Limited token authentication error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.limitedUser) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!req.limitedUser.scope.includes(permission)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Permission '${permission}' required`,
      });
      return;
    }

    next();
  };
};

/**
 * Combined middleware that accepts both full and limited tokens
 */
export const authenticateAnyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = CookieUtils.getAuthToken(req);

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    }

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Access token required",
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    if (decoded.type === "limited_access") {
      // Handle limited access token
      await authenticateLimitedToken(req, res, next);
    } else {
      // Handle full access token (use existing middleware)
      const { authenticateToken } = await import("./authMiddleware");
      await authenticateToken(req, res, next);
    }
  } catch (error) {
    console.error("Token authentication error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};
