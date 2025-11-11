"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const emailService_1 = require("../services/emailService");
const botProtection_1 = require("../middleware/botProtection");
const authMiddleware_1 = require("../middleware/authMiddleware");
const limitedAuthMiddleware_1 = require("../middleware/limitedAuthMiddleware");
const authValidation_1 = require("../validation/authValidation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const cookieUtils_1 = require("../utils/cookieUtils");
const router = (0, express_1.Router)();
router.post("/register", (0, rateLimiter_1.authRateLimit)(5, 15 * 60 * 1000), botProtection_1.BotProtection.blockBots(0.7), (0, authValidation_1.validateRequest)(authValidation_1.registerSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    const botValidation = await botProtection_1.BotProtection.validateRegistration(req);
    if (!botValidation.valid) {
        return response_1.ResponseUtil.forbidden(res, botValidation.reason || "Registration blocked");
    }
    const passwordValidation = authService_1.AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
        return response_1.ResponseUtil.validationError(res, passwordValidation.errors, "Password does not meet security requirements");
    }
    const result = await authService_1.AuthService.register({ email, password, firstName, lastName });
    await emailService_1.EmailService.sendVerificationEmail(result.user.email, result.verificationToken);
    cookieUtils_1.CookieUtils.setAuthSession(res, result.limitedToken, undefined, "limited");
    response_1.ResponseUtil.created(res, {
        user: result.user,
        message: "Registration successful! Please check your email to verify your account.",
        tokenType: "limited",
    }, "User registered successfully. Email verification required.");
}));
router.post("/login", (0, rateLimiter_1.authRateLimit)(5, 15 * 60 * 1000), (0, authValidation_1.validateRequest)(authValidation_1.loginSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService_1.AuthService.login({ email, password });
    cookieUtils_1.CookieUtils.setAuthSession(res, result.token, undefined, "full");
    response_1.ResponseUtil.success(res, {
        user: result.user,
    }, "Login successful");
}));
router.post("/logout", limitedAuthMiddleware_1.authenticateAnyToken, async (req, res) => {
    try {
        const user = req.user || req.limitedUser;
        if (!user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        await authService_1.AuthService.logout(user.id);
        cookieUtils_1.CookieUtils.clearAuthSession(res);
        res.status(200).json({
            message: "Logout successful",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            error: "Logout failed",
            message: "An error occurred during logout",
        });
    }
});
router.get("/profile", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const user = await authService_1.AuthService.getUserProfile(req.user.id);
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
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            error: "Failed to retrieve profile",
            message: "An error occurred while retrieving profile",
        });
    }
});
router.put("/profile", authMiddleware_1.authenticateToken, (0, authValidation_1.validateRequest)(authValidation_1.updateProfileSchema), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { email, firstName, lastName } = req.body;
        const updatedUser = await authService_1.AuthService.updateProfile(req.user.id, {
            email,
            firstName,
            lastName,
        });
        res.status(200).json({
            message: "Profile updated successfully",
            data: { user: updatedUser },
        });
    }
    catch (error) {
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
router.put("/change-password", authMiddleware_1.authenticateToken, (0, authValidation_1.validateRequest)(authValidation_1.changePasswordSchema), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        const passwordValidation = authService_1.AuthService.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                error: "Invalid password",
                message: "New password does not meet security requirements",
                details: passwordValidation.errors,
            });
            return;
        }
        await authService_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json({
            message: "Password changed successfully",
        });
    }
    catch (error) {
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
router.get("/verify-email/:token", (0, rateLimiter_1.authRateLimit)(10, 60 * 60 * 1000), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    if (!token) {
        return response_1.ResponseUtil.error(res, "Verification token is required", 400, "VALIDATION_ERROR", {
            token: "Verification token is required",
        });
    }
    const result = await authService_1.AuthService.verifyEmail(token);
    cookieUtils_1.CookieUtils.setAuthSession(res, result.token, undefined, "full");
    response_1.ResponseUtil.success(res, {
        user: result.user,
    }, "Email verified successfully! You are now logged in.");
}));
router.post("/resend-verification", (0, rateLimiter_1.authRateLimit)(3, 60 * 60 * 1000), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return response_1.ResponseUtil.error(res, "Email is required", 400);
    }
    const verificationToken = await authService_1.AuthService.resendEmailVerification(email);
    await emailService_1.EmailService.sendVerificationEmail(email, verificationToken);
    response_1.ResponseUtil.success(res, { message: "Verification email sent successfully" }, "If an unverified account exists with this email, a new verification link has been sent.");
}));
router.get("/profile/limited", limitedAuthMiddleware_1.authenticateLimitedToken, (0, limitedAuthMiddleware_1.requirePermission)("profile:read"), async (req, res) => {
    try {
        if (!req.limitedUser) {
            res.status(401).json({
                error: "Unauthorized",
                message: "Limited access token required",
            });
            return;
        }
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
    }
    catch (error) {
        console.error("Limited profile error:", error);
        res.status(500).json({
            error: "Failed to retrieve profile",
            message: "An error occurred while retrieving limited profile",
        });
    }
});
router.get("/verify", limitedAuthMiddleware_1.authenticateAnyToken, async (req, res) => {
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
    }
    catch (error) {
        console.error("Token verification error:", error);
        res.status(500).json({
            error: "Verification failed",
            message: "An error occurred during token verification",
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map