// Set environment variables before any imports
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-12345";
process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";
process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id";
process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret";
process.env.INSTAGRAM_CLIENT_ID = "test-instagram-client-id";
process.env.INSTAGRAM_CLIENT_SECRET = "test-instagram-client-secret";
process.env.TWITTER_CLIENT_ID = "test-twitter-client-id";
process.env.TWITTER_CLIENT_SECRET = "test-twitter-client-secret";
process.env.TIKTOK_CLIENT_ID = "test-tiktok-client-id";
process.env.TIKTOK_CLIENT_SECRET = "test-tiktok-client-secret";
process.env.OPENAI_API_KEY = "test-openai-api-key";

import { AuthService } from "../authService";
import { prisma } from "../../config/database";
// Removed Redis import - now using Prisma sessions
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock Prisma UserSession operations
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(),
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

// Create proper mocks
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

// Mock UserSession operations
const mockUserSession = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  deleteMany: jest.fn(),
} as any;

// Add UserSession to the mocked prisma
mockPrisma.userSession = mockUserSession;

// Replace the actual prisma import with our mock
(prisma as any).user = mockPrisma.user;
(prisma as any).userSession = mockUserSession;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const registerData = {
      email: "test@example.com",
      password: "TestPassword123!",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register a new user successfully", async () => {
      const hashedPassword = "hashedPassword123";
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "jwt.token.here";

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue(mockToken as never);
      mockUserSession.deleteMany.mockResolvedValue({ count: 0 });
      mockUserSession.create.mockResolvedValue({});

      const result = await AuthService.register(registerData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("TestPassword123!", 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: hashedPassword,
          firstName: "John",
          lastName: "Doe",
        },
      });
      expect(result.user).toEqual(
        expect.objectContaining({
          id: "user123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        })
      );
      expect(result.user).not.toHaveProperty("password");
      expect(result.token).toBe(mockToken);
    });

    it("should throw error if user already exists", async () => {
      const existingUser = {
        id: "existing123",
        email: "test@example.com",
        password: "hashedPassword",
        firstName: "Jane",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(AuthService.register(registerData)).rejects.toThrow("User with this email already exists");
    });
  });

  describe("login", () => {
    const loginData = {
      email: "test@example.com",
      password: "TestPassword123!",
    };

    it("should login user successfully", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "jwt.token.here";

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: new Date(),
      });
      mockJwt.sign.mockReturnValue(mockToken as never);
      mockUserSession.deleteMany.mockResolvedValue({ count: 0 });
      mockUserSession.create.mockResolvedValue({});

      const result = await AuthService.login(loginData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith("TestPassword123!", "hashedPassword");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(result.user).not.toHaveProperty("password");
      expect(result.token).toBe(mockToken);
    });

    it("should throw error for invalid email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.login(loginData)).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for invalid password", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(AuthService.login(loginData)).rejects.toThrow("Invalid email or password");
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token successfully", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "user123", email: "test@example.com" };

      mockJwt.verify.mockReturnValue(decodedPayload as never);
      mockUserSession.findUnique.mockResolvedValue({
        userId: "user123",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await AuthService.verifyToken(token);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(mockUserSession.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token },
          select: { userId: true, expiresAt: true },
        })
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user123" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null for invalid token", async () => {
      const token = "invalid.jwt.token";

      mockJwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = await AuthService.verifyToken(token);

      expect(result).toBeNull();
    });

    it("should return null if token not in cache", async () => {
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "user123", email: "test@example.com" };

      mockJwt.verify.mockReturnValue(decodedPayload as never);
      mockUserSession.findUnique.mockResolvedValue(null);

      const result = await AuthService.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("should validate strong password", () => {
      const result = AuthService.validatePassword("StrongPass123!");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject weak passwords", () => {
      const testCases = [
        { password: "short", expectedErrors: 4 }, // length, uppercase, number, special char
        { password: "nouppercase123!", expectedErrors: 1 },
        { password: "NOLOWERCASE123!", expectedErrors: 1 },
        { password: "NoNumbers!", expectedErrors: 1 },
        { password: "NoSpecialChars123", expectedErrors: 1 },
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = AuthService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors);
      });
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      const userId = "user123";
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      };
      const updatedUser = {
        id: userId,
        email: "jane@example.com",
        password: "hashedPassword",
        firstName: "Jane",
        lastName: "Smith",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await AuthService.updateProfile(userId, updateData);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: "jane@example.com",
          NOT: { id: userId },
        },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          ...updateData,
          email: "jane@example.com",
          updatedAt: expect.any(Date),
        },
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should throw error if email is already taken", async () => {
      const userId = "user123";
      const updateData = { email: "taken@example.com" };
      const existingUser = {
        id: "other123",
        email: "taken@example.com",
        password: "hashedPassword",
        firstName: "Other",
        lastName: "User",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(AuthService.updateProfile(userId, updateData)).rejects.toThrow("Email is already taken");
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const userId = "user123";
      const currentPassword = "OldPassword123!";
      const newPassword = "NewPassword123!";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        password: "hashedOldPassword",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue("hashedNewPassword" as never);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: "hashedNewPassword",
      });
      mockUserSession.deleteMany.mockResolvedValue({ count: 1 });

      await AuthService.changePassword(userId, currentPassword, newPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(currentPassword, "hashedOldPassword");
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          password: "hashedNewPassword",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should throw error for incorrect current password", async () => {
      const userId = "user123";
      const currentPassword = "WrongPassword123!";
      const newPassword = "NewPassword123!";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        password: "hashedOldPassword",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(AuthService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow("Current password is incorrect");
    });
  });
});
