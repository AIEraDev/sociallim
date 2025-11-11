"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ServiceUnavailableError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.createError = void 0;
const client_1 = require("@prisma/client");
const createError = (message, statusCode = 500, code, retryable = false, context) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    error.code = code;
    error.retryable = retryable;
    error.context = context;
    return error;
};
exports.createError = createError;
class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.statusCode = 400;
        this.isOperational = true;
        this.code = "VALIDATION_ERROR";
        this.retryable = false;
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends Error {
    constructor(message = "Authentication required") {
        super(message);
        this.statusCode = 401;
        this.isOperational = true;
        this.code = "AUTHENTICATION_ERROR";
        this.retryable = false;
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message = "Insufficient permissions") {
        super(message);
        this.statusCode = 403;
        this.isOperational = true;
        this.code = "AUTHORIZATION_ERROR";
        this.retryable = false;
        this.name = "AuthorizationError";
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends Error {
    constructor(message = "Resource not found", resource) {
        super(message);
        this.resource = resource;
        this.statusCode = 404;
        this.isOperational = true;
        this.code = "NOT_FOUND_ERROR";
        this.retryable = false;
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends Error {
    constructor(message = "Resource conflict", field) {
        super(message);
        this.field = field;
        this.statusCode = 409;
        this.isOperational = true;
        this.code = "CONFLICT_ERROR";
        this.retryable = false;
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends Error {
    constructor(message = "Rate limit exceeded", retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
        this.statusCode = 429;
        this.isOperational = true;
        this.code = "RATE_LIMIT_ERROR";
        this.retryable = true;
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
class ExternalServiceError extends Error {
    constructor(message, service, originalError) {
        super(message);
        this.service = service;
        this.originalError = originalError;
        this.statusCode = 502;
        this.isOperational = true;
        this.code = "EXTERNAL_SERVICE_ERROR";
        this.retryable = true;
        this.name = "ExternalServiceError";
    }
}
exports.ExternalServiceError = ExternalServiceError;
class ServiceUnavailableError extends Error {
    constructor(message = "Service temporarily unavailable") {
        super(message);
        this.statusCode = 503;
        this.isOperational = true;
        this.code = "SERVICE_UNAVAILABLE_ERROR";
        this.retryable = true;
        this.name = "ServiceUnavailableError";
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
const logError = (error, req, level = "error") => {
    const logData = {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        correlationId: req.headers["x-correlation-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    if (level === "error") {
        console.error("Application Error:", logData);
    }
    else if (level === "warn") {
        console.warn("Application Warning:", logData);
    }
    else {
        console.info("Application Info:", logData);
    }
};
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let code = "INTERNAL_ERROR";
    let details = undefined;
    let retryable = false;
    let userMessage = "An unexpected error occurred. Please try again later.";
    if (error instanceof ValidationError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = `Validation failed: ${error.message}`;
        if (error.field) {
            details = { field: error.field, value: error.value };
        }
    }
    else if (error instanceof AuthenticationError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = "Please log in to access this resource.";
    }
    else if (error instanceof AuthorizationError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = "You don't have permission to perform this action.";
    }
    else if (error instanceof NotFoundError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = error.resource ? `${error.resource} not found.` : "The requested resource was not found.";
    }
    else if (error instanceof ConflictError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = "This resource already exists or conflicts with existing data.";
        if (error.field) {
            details = { field: error.field };
        }
    }
    else if (error instanceof RateLimitError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = "Too many requests. Please wait a moment before trying again.";
        if (error.retryAfter) {
            details = { retryAfter: error.retryAfter };
            res.set("Retry-After", error.retryAfter.toString());
        }
    }
    else if (error instanceof ExternalServiceError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = error.service ? `${error.service} is currently unavailable. Please try again later.` : "External service is temporarily unavailable. Please try again later.";
        if (error.service) {
            details = { service: error.service };
        }
    }
    else if (error instanceof ServiceUnavailableError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
        retryable = error.retryable;
        userMessage = "Service is temporarily unavailable. Please try again later.";
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = "Invalid data provided to database";
        code = "VALIDATION_ERROR";
        userMessage = "Invalid data provided. Please check your input.";
    }
    else if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        message = "Database connection failed";
        code = "DATABASE_CONNECTION_ERROR";
        userMessage = "Database is temporarily unavailable. Please try again later.";
        retryable = true;
    }
    else if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
        statusCode = 500;
        message = "Database engine error";
        code = "DATABASE_ENGINE_ERROR";
        userMessage = "Database error occurred. Please try again later.";
        retryable = true;
    }
    else if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
        code = "INVALID_TOKEN";
        userMessage = "Invalid authentication token. Please log in again.";
    }
    else if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
        code = "TOKEN_EXPIRED";
        userMessage = "Your session has expired. Please log in again.";
    }
    else if (error.name === "NotBeforeError") {
        statusCode = 401;
        message = "Token not active";
        code = "TOKEN_NOT_ACTIVE";
        userMessage = "Authentication token is not yet valid.";
    }
    else if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
        code = "VALIDATION_ERROR";
        userMessage = "Please check your input and try again.";
        details = error.message;
    }
    else if (error.name === "MulterError") {
        statusCode = 400;
        code = "FILE_UPLOAD_ERROR";
        switch (error.code) {
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
    else if ("statusCode" in error && error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code || "APPLICATION_ERROR";
        retryable = error.retryable || false;
        userMessage = error.message;
        details = error.context;
    }
    else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        statusCode = 503;
        message = "External service unavailable";
        code = "EXTERNAL_SERVICE_UNAVAILABLE";
        userMessage = "External service is temporarily unavailable. Please try again later.";
        retryable = true;
    }
    else if (error.message.includes("timeout")) {
        statusCode = 504;
        message = "Request timeout";
        code = "REQUEST_TIMEOUT";
        userMessage = "Request timed out. Please try again.";
        retryable = true;
    }
    if (statusCode >= 500) {
        logError(error, req, "error");
    }
    else if (statusCode >= 400) {
        logError(error, req, "warn");
    }
    const response = {
        error: {
            message: userMessage,
            code,
            status: statusCode,
            timestamp: new Date().toISOString(),
            retryable,
        },
    };
    if (process.env.NODE_ENV === "development") {
        response.error.technical = {
            message: error.message,
            stack: error.stack,
        };
    }
    if (details) {
        response.error.details = details;
    }
    const correlationId = req.headers["x-correlation-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    response.error.correlationId = correlationId;
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map