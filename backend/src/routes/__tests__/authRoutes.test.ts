import request from "supertest";
import express from "express";
import authRoutes from "../authRoutes";

// Create test app
const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

// Add error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  if (error.message === "User with this email already exists") {
    return res.status(409).json({
      error: "Registration failed",
      message: error.message,
    });
  }
  if (error.message === "Invalid email or password") {
    return res.status(401).json({
      error: "Login failed",
      message: error.message,
    });
  }
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Mock the AuthService
jest.mock("../../services/authService", () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getUserProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    validatePassword: jest.fn(),
  },
}));

// Mock the middleware
jest.mock("../../middleware/authMiddleware", () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // Mock authenticated user
    req.user = {
      id: "user123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
  }),
  authRateLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock the rate limiter
jest.mock("../../middleware/rateLimiter", () => ({
  authRateLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
  generalRateLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import { AuthService } from "../../services/authService";

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPassword123!",
        firstName: "John",
        lastName: "Doe",
      };

      const mockResult = {
        user: {
          id: "user123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          isEmailVerified: false,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: "jwt.token.here",
      };

      mockAuthService.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockAuthService.register.mockResolvedValue(mockResult);

      const response = await request(app).post("/auth/register").send(userData).expect(201);

      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data.user.id).toBe("user123");
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.token).toBe("jwt.token.here");
      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
    });

    it("should return 400 for invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "TestPassword123!",
      };

      const response = await request(app).post("/auth/register").send(userData).expect(400);

      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 400 for weak password", async () => {
      const userData = {
        email: "test@example.com",
        password: "weak",
      };

      const response = await request(app).post("/auth/register").send(userData).expect(400);

      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 409 for existing user", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPassword123!",
      };

      mockAuthService.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockAuthService.register.mockRejectedValue(new Error("User with this email already exists"));

      const response = await request(app).post("/auth/register").send(userData).expect(409);

      expect(response.body.error).toBe("Registration failed");
      expect(response.body.message).toBe("User with this email already exists");
    });
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const loginData = {
        email: "test@example.com",
        password: "TestPassword123!",
      };

      const mockResult = {
        user: {
          id: "user123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          isEmailVerified: false,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: "jwt.token.here",
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const response = await request(app).post("/auth/login").send(loginData).expect(200);

      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.user.id).toBe("user123");
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.token).toBe("jwt.token.here");
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it("should return 401 for invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockAuthService.login.mockRejectedValue(new Error("Invalid email or password"));

      const response = await request(app).post("/auth/login").send(loginData).expect(401);

      expect(response.body.error).toBe("Login failed");
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout user successfully", async () => {
      mockAuthService.logout.mockResolvedValue();

      const response = await request(app).post("/auth/logout").expect(200);

      expect(response.body.message).toBe("Logout successful");
      expect(mockAuthService.logout).toHaveBeenCalledWith("user123");
    });
  });

  describe("GET /auth/profile", () => {
    it("should get user profile successfully", async () => {
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockUser);

      const response = await request(app).get("/auth/profile").expect(200);

      expect(response.body.message).toBe("Profile retrieved successfully");
      expect(response.body.data.user.id).toBe("user123");
      expect(response.body.data.user.email).toBe("test@example.com");
    });
  });

  describe("PUT /auth/profile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
      };

      const updatedUser = {
        id: "user123",
        email: "test@example.com",
        firstName: "Jane",
        lastName: "Smith",
        isEmailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app).put("/auth/profile").send(updateData).expect(200);

      expect(response.body.message).toBe("Profile updated successfully");
      expect(response.body.data.user.firstName).toBe("Jane");
      expect(response.body.data.user.lastName).toBe("Smith");
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith("user123", updateData);
    });
  });

  describe("PUT /auth/change-password", () => {
    it("should change password successfully", async () => {
      const passwordData = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      };

      mockAuthService.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockAuthService.changePassword.mockResolvedValue();

      const response = await request(app).put("/auth/change-password").send(passwordData).expect(200);

      expect(response.body.message).toBe("Password changed successfully");
      expect(mockAuthService.changePassword).toHaveBeenCalledWith("user123", "OldPassword123!", "NewPassword123!");
    });

    it("should return 400 for weak new password", async () => {
      const passwordData = {
        currentPassword: "OldPassword123!",
        newPassword: "weak",
        confirmPassword: "weak",
      };

      mockAuthService.validatePassword.mockReturnValue({
        isValid: false,
        errors: ["Password too weak"],
      });

      const response = await request(app).put("/auth/change-password").send(passwordData).expect(400);

      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("GET /auth/verify", () => {
    it("should verify token successfully", async () => {
      const response = await request(app).get("/auth/verify").expect(200);

      expect(response.body.message).toBe("Token is valid");
      expect(response.body.data.user).toBeDefined();
    });
  });
});
