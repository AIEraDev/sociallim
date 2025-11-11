import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { tokenManager } from "../services/tokenManager";
import { Platform } from "@prisma/client";

const router = Router();

/**
 * Validate all tokens for the authenticated user
 */
router.get("/validate-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const results = await tokenManager.validateAllTokens(userId);

    return res.json({
      userId,
      tokenStatus: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error validating all tokens:", error);
    return res.status(500).json({ error: "Failed to validate tokens" });
  }
});

/**
 * Refresh all expiring tokens for the authenticated user
 */
router.post("/refresh-expiring", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const results = await tokenManager.refreshExpiringTokens(userId);

    return res.json({
      userId,
      refreshResults: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing expiring tokens:", error);
    return res.status(500).json({ error: "Failed to refresh tokens" });
  }
});

/**
 * Get a valid token for a specific platform
 * This endpoint automatically handles token refresh if needed
 */
router.get("/valid/:platform", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = (req as any).user.id;

    // Validate platform parameter
    if (!Object.values(Platform).includes(platform.toUpperCase() as Platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const platformEnum = platform.toUpperCase() as Platform;
    const validToken = await tokenManager.getValidToken(userId, platformEnum);

    if (!validToken) {
      return res.status(404).json({
        error: "No valid token available",
        message: "Please reconnect your account",
        platform: platform,
      });
    }

    // Don't return the actual token for security reasons
    // Just confirm that a valid token is available
    return res.json({
      platform,
      hasValidToken: true,
      message: "Valid token available for API calls",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting valid token:", error);

    if (error instanceof Error && error.message.includes("Please reconnect")) {
      return res.status(401).json({
        error: "Token refresh failed",
        message: error.message,
        needsReconnection: true,
      });
    }

    return res.status(500).json({ error: "Failed to get valid token" });
  }
});

/**
 * Health check endpoint for token management system
 */
router.get("/health", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get basic connection info without validating tokens (faster)
    const connections = await tokenManager.validateAllTokens(userId);

    const summary = {
      totalConnections: connections.length,
      validConnections: connections.filter((c) => c.isValid).length,
      invalidConnections: connections.filter((c) => !c.isValid).length,
      needsReconnection: connections.filter((c) => c.needsReconnection).length,
      platforms: connections.map((c) => ({
        platform: c.platform,
        status: c.isValid ? "valid" : "invalid",
      })),
    };

    return res.json({
      userId,
      tokenHealth: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking token health:", error);
    return res.status(500).json({ error: "Failed to check token health" });
  }
});

/**
 * Admin endpoint to cleanup expired tokens (requires special permissions)
 * This would typically be called by a background job
 */
router.post("/cleanup-expired", authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a real application, you'd want to check for admin permissions here
    // For now, we'll allow any authenticated user to trigger cleanup for demo purposes

    const results = await tokenManager.cleanupExpiredTokens();

    return res.json({
      message: "Token cleanup completed",
      deletedConnections: results.deletedConnections,
      errors: results.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error during token cleanup:", error);
    return res.status(500).json({ error: "Failed to cleanup expired tokens" });
  }
});

export { router as tokenRoutes };
