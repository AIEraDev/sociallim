import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  retryable?: boolean;
  context?: Record<string, any>;
}

export const createError = (message: string, statusCode: number = 500, code?: string, retryable: boolean = false, context?: Record<string, any>): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  error.retryable = retryable;
  error.context = context;
  return error;
};

// Specific error types for better categorization
export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = "VALIDATION_ERROR";
  retryable = false;

  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;
  code = "AUTHENTICATION_ERROR";
  retryable = false;

  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;
  code = "AUTHORIZATION_ERROR";
  retryable = false;

  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  code = "NOT_FOUND_ERROR";
  retryable = false;

  constructor(message: string = "Resource not found", public resource?: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  isOperational = true;
  code = "CONFLICT_ERROR";
  retryable = false;

  constructor(message: string = "Resource conflict", public field?: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;
  code = "RATE_LIMIT_ERROR";
  retryable = true;

  constructor(message: string = "Rate limit exceeded", public retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  isOperational = true;
  code = "EXTERNAL_SERVICE_ERROR";
  retryable = true;

  constructor(message: string, public service?: string, public originalError?: Error) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  isOperational = true;
  code = "SERVICE_UNAVAILABLE_ERROR";
  retryable = true;

  constructor(message: string = "Service temporarily unavailable") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

// Error logging utility
const logError = (error: Error, req: Request, level: "error" | "warn" | "info" = "error") => {
  const logData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    correlationId: req.headers["x-correlation-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  if (level === "error") {
    console.error("Application Error:", logData);
  } else if (level === "warn") {
    console.warn("Application Warning:", logData);
  } else {
    console.info("Application Info:", logData);
  }
};

// Enhanced error handler with better categorization and user-friendly messages
export const errorHandler = (error: AppError | Error, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_ERROR";
  let details: any = undefined;
  let retryable = false;
  let userMessage = "An unexpected error occurred. Please try again later.";

  // Handle custom application errors
  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = `Validation failed: ${error.message}`;
    if (error.field) {
      details = { field: error.field, value: error.value };
    }
  } else if (error instanceof AuthenticationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = "Please log in to access this resource.";
  } else if (error instanceof AuthorizationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = "You don't have permission to perform this action.";
  } else if (error instanceof NotFoundError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = error.resource ? `${error.resource} not found.` : "The requested resource was not found.";
  } else if (error instanceof ConflictError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = "This resource already exists or conflicts with existing data.";
    if (error.field) {
      details = { field: error.field };
    }
  } else if (error instanceof RateLimitError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = "Too many requests. Please wait a moment before trying again.";
    if (error.retryAfter) {
      details = { retryAfter: error.retryAfter };
      res.set("Retry-After", error.retryAfter.toString());
    }
  } else if (error instanceof ExternalServiceError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = error.service ? `${error.service} is currently unavailable. Please try again later.` : "External service is temporarily unavailable. Please try again later.";
    if (error.service) {
      details = { service: error.service };
    }
  } else if (error instanceof ServiceUnavailableError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    retryable = error.retryable;
    userMessage = "Service is temporarily unavailable. Please try again later.";
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        message = "Unique constraint violation";
        code = "DUPLICATE_RESOURCE";
        userMessage = "This resource already exists.";
        details = { field: error.meta?.target };
        break;
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        code = "RESOURCE_NOT_FOUND";
        userMessage = "The requested resource was not found.";
        break;
      case "P2003":
        statusCode = 400;
        message = "Foreign key constraint failed";
        code = "INVALID_REFERENCE";
        userMessage = "Invalid reference to related resource.";
        break;
      case "P2014":
        statusCode = 400;
        message = "Invalid ID provided";
        code = "INVALID_ID";
        userMessage = "Invalid ID format provided.";
        break;
      case "P2021":
        statusCode = 404;
        message = "Table does not exist";
        code = "TABLE_NOT_FOUND";
        userMessage = "Database configuration error.";
        break;
      case "P2022":
        statusCode = 404;
        message = "Column does not exist";
        code = "COLUMN_NOT_FOUND";
        userMessage = "Database configuration error.";
        break;
      default:
        statusCode = 400;
        message = "Database operation failed";
        code = "DATABASE_ERROR";
        userMessage = "Database operation failed. Please try again.";
        retryable = true;
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided to database";
    code = "VALIDATION_ERROR";
    userMessage = "Invalid data provided. Please check your input.";
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = "Database connection failed";
    code = "DATABASE_CONNECTION_ERROR";
    userMessage = "Database is temporarily unavailable. Please try again later.";
    retryable = true;
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = "Database engine error";
    code = "DATABASE_ENGINE_ERROR";
    userMessage = "Database error occurred. Please try again later.";
    retryable = true;
  }
  // Handle JWT errors
  else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
    userMessage = "Invalid authentication token. Please log in again.";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
    userMessage = "Your session has expired. Please log in again.";
  } else if (error.name === "NotBeforeError") {
    statusCode = 401;
    message = "Token not active";
    code = "TOKEN_NOT_ACTIVE";
    userMessage = "Authentication token is not yet valid.";
  }
  // Handle validation errors from express-validator or joi
  else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    userMessage = "Please check your input and try again.";
    details = error.message;
  }
  // Handle multer errors (file upload)
  else if (error.name === "MulterError") {
    statusCode = 400;
    code = "FILE_UPLOAD_ERROR";
    switch ((error as any).code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        userMessage = "File size exceeds the maximum allowed limit.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        userMessage = "Too many files uploaded.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        userMessage = "Unexpected file in upload.";
        break;
      default:
        message = "File upload error";
        userMessage = "File upload failed. Please try again.";
    }
  }
  // Handle custom app errors with statusCode
  else if ("statusCode" in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    code = (error as AppError).code || "APPLICATION_ERROR";
    retryable = (error as AppError).retryable || false;
    userMessage = error.message;
    details = (error as AppError).context;
  }
  // Handle network and external service errors
  else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
    statusCode = 503;
    message = "External service unavailable";
    code = "EXTERNAL_SERVICE_UNAVAILABLE";
    userMessage = "External service is temporarily unavailable. Please try again later.";
    retryable = true;
  } else if (error.message.includes("timeout")) {
    statusCode = 504;
    message = "Request timeout";
    code = "REQUEST_TIMEOUT";
    userMessage = "Request timed out. Please try again.";
    retryable = true;
  }

  // Log error based on severity
  if (statusCode >= 500) {
    logError(error, req, "error");
  } else if (statusCode >= 400) {
    logError(error, req, "warn");
  }

  // Build error response
  const response: any = {
    error: {
      message: userMessage,
      code,
      status: statusCode,
      timestamp: new Date().toISOString(),
      retryable,
    },
  };

  // Add technical details for development
  if (process.env.NODE_ENV === "development") {
    response.error.technical = {
      message: error.message,
      stack: error.stack,
    };
  }

  // Add additional details if available
  if (details) {
    response.error.details = details;
  }

  // Add correlation ID for tracking
  const correlationId = req.headers["x-correlation-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  response.error.correlationId = correlationId;

  res.status(statusCode).json(response);
};
