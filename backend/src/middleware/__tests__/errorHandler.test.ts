import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { errorHandler, ValidationError, AuthenticationError, NotFoundError, ConflictError, RateLimitError, ExternalServiceError } from "../errorHandler";

// Mock response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request object
const mockRequest = () => {
  const req = {} as Request;
  req.url = "/test";
  req.method = "GET";
  Object.defineProperty(req, "ip", { value: "127.0.0.1", writable: true });
  req.get = jest.fn().mockReturnValue("test-agent");
  req.headers = {};
  return req;
};

describe("Error Handler Middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();

    // Mock console methods
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Custom Error Types", () => {
    it("should handle ValidationError correctly", () => {
      const error = new ValidationError("Invalid input", "email", "invalid-email");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Validation failed: Invalid input",
            code: "VALIDATION_ERROR",
            status: 400,
            retryable: false,
          }),
        })
      );
    });

    it("should handle AuthenticationError correctly", () => {
      const error = new AuthenticationError("Token expired");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Please log in to access this resource.",
            code: "AUTHENTICATION_ERROR",
            status: 401,
          }),
        })
      );
    });

    it("should handle NotFoundError correctly", () => {
      const error = new NotFoundError("User not found", "User");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "User not found.",
            code: "NOT_FOUND_ERROR",
            status: 404,
          }),
        })
      );
    });

    it("should handle ConflictError correctly", () => {
      const error = new ConflictError("Email already exists", "email");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "This resource already exists or conflicts with existing data.",
            code: "CONFLICT_ERROR",
            status: 409,
          }),
        })
      );
    });

    it("should handle RateLimitError correctly", () => {
      const error = new RateLimitError("Rate limit exceeded", 60);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.set).toHaveBeenCalledWith("Retry-After", "60");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Too many requests. Please wait a moment before trying again.",
            code: "RATE_LIMIT_ERROR",
            status: 429,
            retryable: true,
          }),
        })
      );
    });

    it("should handle ExternalServiceError correctly", () => {
      const error = new ExternalServiceError("Service unavailable", "YouTube API");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "YouTube API is currently unavailable. Please try again later.",
            code: "EXTERNAL_SERVICE_ERROR",
            status: 502,
            retryable: true,
          }),
        })
      );
    });
  });

  describe("Prisma Errors", () => {
    it("should handle Prisma unique constraint violation", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "4.0.0",
        meta: { target: ["email"] },
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "This resource already exists.",
            code: "DUPLICATE_RESOURCE",
            status: 409,
          }),
        })
      );
    });

    it("should handle Prisma record not found", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "4.0.0",
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "The requested resource was not found.",
            code: "RESOURCE_NOT_FOUND",
            status: 404,
          }),
        })
      );
    });

    it("should handle Prisma validation error", () => {
      const error = new Prisma.PrismaClientValidationError("Invalid data provided", { clientVersion: "4.0.0" });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Invalid data provided. Please check your input.",
            code: "VALIDATION_ERROR",
            status: 400,
          }),
        })
      );
    });
  });

  describe("JWT Errors", () => {
    it("should handle JsonWebTokenError", () => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Invalid authentication token. Please log in again.",
            code: "INVALID_TOKEN",
            status: 401,
          }),
        })
      );
    });

    it("should handle TokenExpiredError", () => {
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Your session has expired. Please log in again.",
            code: "TOKEN_EXPIRED",
            status: 401,
          }),
        })
      );
    });
  });

  describe("Network Errors", () => {
    it("should handle connection refused errors", () => {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "External service is temporarily unavailable. Please try again later.",
            code: "EXTERNAL_SERVICE_UNAVAILABLE",
            status: 503,
            retryable: true,
          }),
        })
      );
    });

    it("should handle timeout errors", () => {
      const error = new Error("Request timeout after 30000ms");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Request timed out. Please try again.",
            code: "REQUEST_TIMEOUT",
            status: 504,
            retryable: true,
          }),
        })
      );
    });
  });

  describe("Error Logging", () => {
    it("should log server errors (5xx)", () => {
      const error = new Error("Internal server error");

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        "Application Error:",
        expect.objectContaining({
          message: "Internal server error",
          url: "/test",
          method: "GET",
        })
      );
    });

    it("should log client errors (4xx) as warnings", () => {
      const error = new ValidationError("Invalid input");

      errorHandler(error, req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        "Application Warning:",
        expect.objectContaining({
          message: "Invalid input",
          url: "/test",
          method: "GET",
        })
      );
    });
  });

  describe("Development vs Production", () => {
    it("should include technical details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            technical: expect.objectContaining({
              message: "Test error",
              stack: expect.stringContaining("Error: Test error"),
            }),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include technical details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          error: expect.objectContaining({
            technical: expect.anything(),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Correlation ID", () => {
    it("should use provided correlation ID", () => {
      req.headers["x-correlation-id"] = "test-correlation-id";
      const error = new Error("Test error");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            correlationId: "test-correlation-id",
          }),
        })
      );
    });

    it("should generate correlation ID if not provided", () => {
      const error = new Error("Test error");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            correlationId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
          }),
        })
      );
    });
  });
});
