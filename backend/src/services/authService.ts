import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { prisma } from "../config/database";
import { config } from "../config/environment";
import { CommonCacheConfigs, createEnvCacheStrategy } from "../utils/prismaCache";

/**
 * Helper to add cache strategy only when using Accelerate
 */
function withCacheStrategy<T extends Record<string, any>>(args: T, cacheStrategy: any): T {
  if (process.env.DATABASE_URL?.includes("prisma+")) {
    return { ...args, cacheStrategy };
  }
  return args;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

import { AuthenticatedUser } from "../middleware/authMiddleware";
import { EmailService } from "./emailService";

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication Service
 *
 * Handles user authentication, registration, and session management.
 * Provides secure JWT-based authentication with Prisma Accelerate caching.
 *
 * @class AuthService
 * @description Core authentication service that manages user registration, login,
 * token generation/validation, and session caching using Prisma Accelerate.
 *
 * Features:
 * - Secure password hashing with bcrypt
 * - JWT token generation and validation
 * - Prisma Accelerate caching for performance
 * - Password strength validation
 * - Profile management
 *
 * Security Considerations:
 * - Passwords are hashed using bcrypt with 12 salt rounds
 * - JWT tokens are stored in database with Prisma Accelerate caching
 * - Tokens expire after 7 days by default
 * - Session invalidation on logout
 *
 * @example
 * ```typescript
 * // Register a new user
 * const authResult = await AuthService.register({
 *   email: 'user@example.com',
 *   password: 'securePassword123!',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 *
 * // Login existing user
 * const loginResult = await AuthService.login({
 *   email: 'user@example.com',
 *   password: 'securePassword123!'
 * });
 *
 * // Verify token
 * const user = await AuthService.verifyToken(token);
 * ```
 */
export class AuthService {
  /** Number of salt rounds for password hashing (higher = more secure but slower) */
  private static readonly SALT_ROUNDS = 12;

  /** Default token expiration time in seconds (7 days) */
  private static readonly TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

  /**
   * Register a new user account with email verification
   *
   * Creates a new user account with secure password hashing but requires email verification.
   * User account is created in unverified state and must verify email before login.
   *
   * @param data - User registration information
   * @param data.email - User's email address (must be unique)
   * @param data.password - User's password (must meet security requirements)
   * @param data.firstName - User's first name (optional)
   * @param data.lastName - User's last name (optional)
   *
   * @returns Promise resolving to user data and verification token (no JWT token until verified)
   *
   * @throws {Error} When email already exists or validation fails
   *
   * @example
   * ```typescript
   * const result = await AuthService.register({
   *   email: 'newuser@example.com',
   *   password: 'SecurePass123!',
   *   firstName: 'Jane',
   *   lastName: 'Smith'
   * });
   *
   * // Send verification email with result.verificationToken
   * await EmailService.sendVerificationEmail(result.user.email, result.verificationToken);
   * ```
   */
  static async register(data: RegisterData): Promise<{ user: AuthenticatedUser; verificationToken: string; limitedToken?: any }> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique(
      withCacheStrategy(
        {
          where: { email: email.toLowerCase() },
        },
        createEnvCacheStrategy(300)
      )
    );

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();

    // Create user in unverified state
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Generate limited-access token for unverified users
    const limitedToken = this.generateLimitedToken({
      userId: user.id,
      email: user.email,
      emailVerified: false,
    });

    // Store limited session (shorter expiration)
    await this.storeLimitedUserSession(user.id, limitedToken);

    // Return user without password and sensitive data
    const { password: _, emailVerificationToken: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      verificationToken,
      limitedToken, // Provides limited access until email verification
    };
  }

  /**
   * Authenticate user login
   *
   * Validates user credentials and creates a new authenticated session.
   * Requires email verification before allowing login.
   * Updates the user's last login timestamp and stores the session in database.
   *
   * @param data - User login credentials
   * @param data.email - User's email address
   * @param data.password - User's password
   *
   * @returns Promise resolving to authentication result with user data and JWT token
   *
   * @throws {Error} When credentials are invalid, user doesn't exist, or email not verified
   *
   * @example
   * ```typescript
   * const result = await AuthService.login({
   *   email: 'user@example.com',
   *   password: 'userPassword123!'
   * });
   *
   * // Use the token for subsequent API requests
   * const token = result.token;
   * ```
   */
  static async login(data: LoginData): Promise<AuthResult> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique(
      withCacheStrategy(
        {
          where: { email: email.toLowerCase() },
        },
        createEnvCacheStrategy(300)
      )
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.emailVerified) {
      try {
        // Check if we recently sent a verification email (rate limiting)
        const recentlySent = user.emailVerificationExpires && user.emailVerificationExpires > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

        if (!recentlySent) {
          // Generate a new verification token (old one might be expired)
          const verificationToken = this.generateVerificationToken();

          // Update user with new verification token
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerificationToken: verificationToken,
              emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
          });

          // Send verification email
          await EmailService.sendVerificationEmail(user.email, verificationToken);

          throw new Error("Please verify your email address before logging in. We've sent a new verification link to your inbox.");
        } else {
          throw new Error("Please verify your email address before logging in. Check your inbox for the verification link (sent recently).");
        }
      } catch (emailError) {
        // If email sending fails, still show helpful message
        console.error("Failed to resend verification email:", emailError);
        throw new Error("Please verify your email address before logging in. Check your inbox for the verification link, or contact support if you need help.");
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error("Please verify your email address before logging in. Check your inbox for the verification link.");
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    // Cache user session
    await this.storeUserSession(user.id, token);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Verify JWT token and retrieve user data
   *
   * Validates a JWT token and returns the associated user data if valid.
   * Checks both JWT signature validity and database session for management.
   *
   * @param token - JWT token to verify
   *
   * @returns Promise resolving to User object if token is valid, null otherwise
   *
   * @example
   * ```typescript
   * const user = await AuthService.verifyToken(jwtToken);
   * if (user) {
   *   console.log(`Authenticated user: ${user.email}`);
   * } else {
   *   console.log('Invalid or expired token');
   * }
   * ```
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Check if session exists and is valid
      const session = await this.getSessionByToken(token);

      if (!session || session.userId !== decoded.userId) {
        return null; // Session not found or user mismatch
      }

      // Get user from database with optional caching
      const user = await prisma.user.findUnique(
        withCacheStrategy(
          {
            where: { id: decoded.userId },
          },
          CommonCacheConfigs.userProfile()
        )
      );

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout user by invalidating token
   */
  static async logout(userId: string): Promise<void> {
    // Remove user session
    await this.removeUserSession(userId);
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: Partial<Pick<User, "firstName" | "lastName" | "email">>): Promise<AuthenticatedUser> {
    // If email is being updated, check if it's already taken
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new Error("Email is already taken");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        email: data.email?.toLowerCase(),
        updatedAt: new Date(),
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Invalidate all sessions for this user
    await this.logout(userId);
  }

  /**
   * Generate JWT token
   */
  private static generateToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Generate limited-access token for unverified users
   *
   * Provides restricted access to certain features while email verification is pending
   */
  private static generateLimitedToken(payload: { userId: string; email: string; emailVerified: boolean }): string {
    return jwt.sign(
      {
        ...payload,
        type: "limited_access",
        scope: ["profile:read", "email:resend"], // Limited permissions
      },
      config.jwt.secret,
      { expiresIn: "24h" } // Shorter expiration than full tokens
    );
  }

  /**
   * Generate email verification token
   */
  private static generateVerificationToken(): string {
    return jwt.sign(
      {
        type: "email_verification",
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2),
      },
      config.jwt.secret,
      { expiresIn: "24h" }
    );
  }

  /**
   * Store user session in database with Prisma Accelerate caching
   */
  private static async storeUserSession(userId: string, token: string): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRATION_SECONDS * 1000);

      // Remove any existing sessions for this user (single session per user)
      await prisma.userSession.deleteMany({ where: { userId } });

      // Create new session without caching for debugging
      await prisma.userSession.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Failed to store user session:", error);
      // Temporarily throw the error to see what's happening
      throw error;
    }
  }

  /**
   * Store limited user session (shorter expiration for unverified users)
   */
  private static async storeLimitedUserSession(userId: string, token: string): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Remove any existing sessions for this user
      await prisma.userSession.deleteMany({
        where: { userId },
      });

      // Create limited session
      await prisma.userSession.create(
        withCacheStrategy(
          {
            data: {
              token,
              userId,
              expiresAt,
            },
          },
          createEnvCacheStrategy(24 * 60 * 60) // 24 hours cache
        )
      );
    } catch (error) {
      console.error("Failed to store limited user session:", error);
      // Don't throw error - session storage is not critical for functionality
    }
  }

  /**
   * Get session by token with caching
   */
  private static async getSessionByToken(token: string): Promise<{ userId: string } | null> {
    try {
      const session = await prisma.userSession.findUnique(
        withCacheStrategy(
          {
            where: {
              token,
            },
            select: {
              userId: true,
              expiresAt: true,
            },
          },
          CommonCacheConfigs.authSession()
        )
      );

      // Check if session exists and is not expired
      if (!session || session.expiresAt <= new Date()) {
        return null;
      }

      return session;
    } catch (error) {
      console.error("Failed to get session by token:", error);
      return null;
    }
  }

  /**
   * Remove user session
   */
  private static async removeUserSession(userId: string): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error("Failed to remove user session:", error);
    }
  }

  /**
   * Get user session from database
   */
  static async getUserSession(userId: string): Promise<any | null> {
    try {
      const session = await prisma.userSession.findFirst(
        withCacheStrategy(
          {
            where: {
              userId,
              expiresAt: {
                gt: new Date(),
              },
            },
          },
          CommonCacheConfigs.authSession()
        )
      );

      return session;
    } catch (error) {
      console.error("Failed to get user session:", error);
      return null;
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }

  /**
   * Verify email address with token
   *
   * Validates the email verification token and marks the user's email as verified.
   * Returns authentication result to automatically log in the user after verification.
   *
   * @param token - Email verification token
   *
   * @returns Promise resolving to authentication result with user data and JWT token
   *
   * @throws {Error} When token is invalid, expired, or user not found
   *
   * @example
   * ```typescript
   * const result = await AuthService.verifyEmail(verificationToken);
   * console.log(`Email verified for: ${result.user.email}`);
   * ```
   */
  static async verifyEmail(token: string): Promise<AuthResult> {
    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    // Mark email as verified and clear verification data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
    });

    // Generate JWT token for automatic login
    const jwtToken = this.generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    // Cache user session
    await this.storeUserSession(updatedUser.id, jwtToken);

    // Send welcome email (don't await to avoid blocking the response)
    const { EmailService } = await import("./emailService");
    EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.firstName!).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      token: jwtToken,
    };
  }

  /**
   * Resend email verification
   *
   * Generates a new verification token and sends a new verification email.
   * Can be used when the original verification email expires or is lost.
   *
   * @param email - User's email address
   *
   * @returns Promise resolving to new verification token
   *
   * @throws {Error} When user not found or email already verified
   *
   * @example
   * ```typescript
   * const token = await AuthService.resendEmailVerification('user@example.com');
   * await EmailService.sendVerificationEmail('user@example.com', token);
   * ```
   */
  static async resendEmailVerification(email: string): Promise<string> {
    // Find unverified user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date(),
      },
    });

    return verificationToken;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
