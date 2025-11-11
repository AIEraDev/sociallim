"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addResponseUtils = exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data, message = "Operation successful", statusCode = 200, meta) {
        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                version: process.env.API_VERSION || "1.0.0",
                ...meta,
            },
        };
        res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, code = "INTERNAL_ERROR", details, retryable = false, correlationId) {
        const response = {
            success: false,
            message,
            error: {
                code,
                message,
                details,
                retryable,
                correlationId,
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: process.env.API_VERSION || "1.0.0",
            },
        };
        res.status(statusCode).json(response);
    }
    static validationError(res, errors, message = "Validation failed") {
        ResponseUtil.error(res, message, 400, "VALIDATION_ERROR", errors);
    }
    static notFound(res, resource = "Resource", message) {
        const errorMessage = message || `${resource} not found`;
        ResponseUtil.error(res, errorMessage, 404, "NOT_FOUND");
    }
    static unauthorized(res, message = "Authentication required") {
        ResponseUtil.error(res, message, 401, "UNAUTHORIZED");
    }
    static forbidden(res, message = "Insufficient permissions") {
        ResponseUtil.error(res, message, 403, "FORBIDDEN");
    }
    static conflict(res, message = "Resource conflict", details) {
        ResponseUtil.error(res, message, 409, "CONFLICT", details);
    }
    static rateLimited(res, message = "Rate limit exceeded", retryAfter) {
        if (retryAfter) {
            res.set("Retry-After", retryAfter.toString());
        }
        ResponseUtil.error(res, message, 429, "RATE_LIMITED", { retryAfter }, true);
    }
    static serviceUnavailable(res, message = "Service temporarily unavailable") {
        ResponseUtil.error(res, message, 503, "SERVICE_UNAVAILABLE", undefined, true);
    }
    static paginated(res, data, page, limit, total, message = "Data retrieved successfully") {
        const totalPages = Math.ceil(total / limit);
        ResponseUtil.success(res, data, message, 200, {
            timestamp: new Date().toISOString(),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    }
    static created(res, data, message = "Resource created successfully") {
        ResponseUtil.success(res, data, message, 201);
    }
    static accepted(res, data, message = "Request accepted for processing") {
        ResponseUtil.success(res, data, message, 202);
    }
    static noContent(res) {
        res.status(204).send();
    }
}
exports.ResponseUtil = ResponseUtil;
const addResponseUtils = (req, res, next) => {
    res.success = (data, message, statusCode, meta) => ResponseUtil.success(res, data, message, statusCode, meta);
    res.error = (message, statusCode, code, details, retryable, correlationId) => ResponseUtil.error(res, message, statusCode, code, details, retryable, correlationId);
    res.validationError = (errors, message) => ResponseUtil.validationError(res, errors, message);
    res.notFound = (resource, message) => ResponseUtil.notFound(res, resource, message);
    res.unauthorized = (message) => ResponseUtil.unauthorized(res, message);
    res.forbidden = (message) => ResponseUtil.forbidden(res, message);
    res.conflict = (message, details) => ResponseUtil.conflict(res, message, details);
    res.rateLimited = (message, retryAfter) => ResponseUtil.rateLimited(res, message, retryAfter);
    res.serviceUnavailable = (message) => ResponseUtil.serviceUnavailable(res, message);
    res.paginated = (data, page, limit, total, message) => ResponseUtil.paginated(res, data, page, limit, total, message);
    res.created = (data, message) => ResponseUtil.created(res, data, message);
    res.accepted = (data, message) => ResponseUtil.accepted(res, data, message);
    res.noContent = () => ResponseUtil.noContent(res);
    next();
};
exports.addResponseUtils = addResponseUtils;
//# sourceMappingURL=response.js.map