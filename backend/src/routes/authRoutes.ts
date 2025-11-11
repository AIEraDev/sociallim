import { Router, Request, Response } from "express";
import { AuthService } from "../services/authService";
import { EmailService } from "../services/emailService";
import { BotProtection } from "../middleware/botProtection";
import { authenticateToken } from "../middleware/authMiddleware";
import { authenticateLimitedToken, requirePermission, authenticateAnyToken } from "../middleware/limitedAuthMiddleware";
import { validateRequest, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "../validation/authValidation";
import { authRateLimit } from "../middleware/rateLimiter";
import { asyncHandler } from "../utils/asyncHandler";
import { ResponseUtil } from "../utils/response";
import { CookieUtils } from "../utils/cookieUtils";

const router = Router();

/**
 * POST /auth/register
 * Register a new user account with email verification and bot protection
 */
router.post(
  "/register",
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  BotProtection.blockBots(0.7), // Block high-confidence bots
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName } = req.body;

    // Enhanced bot protection validation
    const botValidation = await BotProtection.validateRegistration(req);
    if (!botValidation.valid) {
      return ResponseUtil.forbidden(res, botValidation.reason || "Registration blocked");
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      return ResponseUtil.validationError(res, passwordValidation.errors, "Password does not meet security requirements");
    }

    const result = await AuthService.register({ email, password, firstName, lastName });

    // Send verification email
    await EmailService.sendVerificationEmail(result.user.email, result.verificationToken);

    // Set secure HTTP-only cookie with limited token
    CookieUtils.setAuthSession(res, result.limitedToken, undefined, "limited");

    ResponseUtil.created(
      res,
      {
        user: result.user,
        message: "Registration successful! Please check your email to verify your account.",
        tokenType: "limited", // Indicate this is a limited access token
      },
      "User registered successfully. Email verification required."
    );
  })
);

/**
 * POST /auth/login
 * Login with email and password
 */
router.post(
  "/login",
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    // Set secure HTTP-only cookie with full access token
    CookieUtils.setAuthSession(res, result.token, undefined, "full");

    ResponseUtil.success(
      res,
      {
        user: result.user,
      },
      "Login successful"
    );
  })
);

/**
 * POST /auth/logout
 * Logout current user (invalidate token and clear cookies)
 */
router.post("/logout", authenticateAnyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user || req.limitedUser;

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    await AuthService.logout(user.id);

    // Clear all authentication cookies
    CookieUtils.clearAuthSession(res);

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      message: "An error occurred during logout",
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get("/profile", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const user = await AuthService.getUserProfile(req.user.id);

    if (!user) {
      res.status(404).json({
        error: "User not found",
        message: "User profile not found",
      });
      return;
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      data: { user },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Failed to retrieve profile",
      message: "An error occurred while retrieving profile",
    });
  }
});

/**
 * PUT /auth/profile
 * Update current user profile
 */
router.put("/profile", authenticateToken, validateRequest(updateProfileSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { email, firstName, lastName } = req.body;

    const updatedUser = await AuthService.updateProfile(req.user.id, {
      email,
      firstName,
      lastName,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.message === "Email is already taken") {
      res.status(409).json({
        error: "Update failed",
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "Update failed",
      message: "An error occurred while updating profile",
    });
  }
});

/**
 * PUT /auth/change-password
 * Change user password
 */
router.put("/change-password", authenticateToken, validateRequest(changePasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate new password strength
    const passwordValidation = AuthService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: "Invalid password",
        message: "New password does not meet security requirements",
        details: passwordValidation.errors,
      });
      return;
    }

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);

    if (error.message === "Current password is incorrect") {
      res.status(400).json({
        error: "Password change failed",
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "Password change failed",
      message: "An error occurred while changing password",
    });
  }
});

/**
 * GET /auth/verify-email/:token
 * Verify email address with token
 */
router.get(
  "/verify-email/:token",
  authRateLimit(10, 60 * 60 * 1000), // 10 attempts per hour
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;

    if (!token) {
      return ResponseUtil.error(res, "Verification token is required", 400, "VALIDATION_ERROR", {
        token: "Verification token is required",
      });
    }

    const result = await AuthService.verifyEmail(token);

    // Set secure HTTP-only cookie with full access token after email verification
    CookieUtils.setAuthSession(res, result.token, undefined, "full");

    ResponseUtil.success(
      res,
      {
        user: result.user,
      },
      "Email verified successfully! You are now logged in."
    );
  })
);

/**
 * POST /auth/resend-verification
 * Resend email verification
 */
router.post(
  "/resend-verification",
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      return ResponseUtil.error(res, "Email is required", 400);
    }

    const verificationToken = await AuthService.resendEmailVerification(email);

    // Send verification email
    await EmailService.sendVerificationEmail(email, verificationToken);

    ResponseUtil.success(res, { message: "Verification email sent successfully" }, "If an unverified account exists with this email, a new verification link has been sent.");
  })
);

/**
 * GET /auth/profile/limited
 * Get limited profile info for unverified users
 */
router.get("/profile/limited", authenticateLimitedToken, requirePermission("profile:read"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.limitedUser) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Limited access token required",
      });
      return;
    }

    // Return limited profile info
    res.status(200).json({
      message: "Limited profile retrieved successfully",
      data: {
        user: {
          id: req.limitedUser.id,
          email: req.limitedUser.email,
          emailVerified: req.limitedUser.emailVerified,
          tokenType: req.limitedUser.tokenType,
        },
      },
    });
  } catch (error: any) {
    console.error("Limited profile error:", error);
    res.status(500).json({
      error: "Failed to retrieve profile",
      message: "An error occurred while retrieving limited profile",
    });
  }
});

/**
 * GET /auth/verify
 * Verify current token validity (supports both full and limited tokens)
 */
router.get("/verify", authenticateAnyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user || req.limitedUser;

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token is invalid or expired",
      });
      return;
    }

    res.status(200).json({
      message: "Token is valid",
      data: {
        user,
        tokenType: req.limitedUser ? "limited" : "full",
      },
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    res.status(500).json({
      error: "Verification failed",
      message: "An error occurred during token verification",
    });
  }
});

export default router;
