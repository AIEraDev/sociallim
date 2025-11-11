import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
    correlationId?: string;
  };
  meta?: {
    timestamp: string;
    version?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Utility class for consistent API responses
 */
export class ResponseUtil {
  /**
   * Send successful response
   */
  static success<T>(res: Response, data: T, message: string = "Operation successful", statusCode: number = 200, meta?: ApiResponse<T>["meta"]): void {
    const response: ApiResponse<T> = {
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

  /**
   * Send error response
   */
  static error(res: Response, message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", details?: any, retryable: boolean = false, correlationId?: string): void {
    const response: ApiResponse = {
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

  /**
   * Send validation error response
   */
  static validationError(res: Response, errors: any, message: string = "Validation failed"): void {
    ResponseUtil.error(res, message, 400, "VALIDATION_ERROR", errors);
  }

  /**
   * Send not found response
   */
  static notFound(res: Response, resource: string = "Resource", message?: string): void {
    const errorMessage = message || `${resource} not found`;
    ResponseUtil.error(res, errorMessage, 404, "NOT_FOUND");
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(res: Response, message: string = "Authentication required"): void {
    ResponseUtil.error(res, message, 401, "UNAUTHORIZED");
  }

  /**
   * Send forbidden response
   */
  static forbidden(res: Response, message: string = "Insufficient permissions"): void {
    ResponseUtil.error(res, message, 403, "FORBIDDEN");
  }

  /**
   * Send conflict response
   */
  static conflict(res: Response, message: string = "Resource conflict", details?: any): void {
    ResponseUtil.error(res, message, 409, "CONFLICT", details);
  }

  /**
   * Send rate limit response
   */
  static rateLimited(res: Response, message: string = "Rate limit exceeded", retryAfter?: number): void {
    if (retryAfter) {
      res.set("Retry-After", retryAfter.toString());
    }
    ResponseUtil.error(res, message, 429, "RATE_LIMITED", { retryAfter }, true);
  }

  /**
   * Send service unavailable response
   */
  static serviceUnavailable(res: Response, message: string = "Service temporarily unavailable"): void {
    ResponseUtil.error(res, message, 503, "SERVICE_UNAVAILABLE", undefined, true);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message: string = "Data retrieved successfully"): void {
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

  /**
   * Send created response
   */
  static created<T>(res: Response, data: T, message: string = "Resource created successfully"): void {
    ResponseUtil.success(res, data, message, 201);
  }

  /**
   * Send accepted response (for async operations)
   */
  static accepted<T>(res: Response, data: T, message: string = "Request accepted for processing"): void {
    ResponseUtil.success(res, data, message, 202);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }
}

/**
 * Express middleware to add response utilities to response object
 */
export const addResponseUtils = (req: any, res: any, next: any) => {
  res.success = (data: any, message?: string, statusCode?: number, meta?: any) => ResponseUtil.success(res, data, message, statusCode, meta);

  res.error = (message: string, statusCode?: number, code?: string, details?: any, retryable?: boolean, correlationId?: string) => ResponseUtil.error(res, message, statusCode, code, details, retryable, correlationId);

  res.validationError = (errors: any, message?: string) => ResponseUtil.validationError(res, errors, message);

  res.notFound = (resource?: string, message?: string) => ResponseUtil.notFound(res, resource, message);

  res.unauthorized = (message?: string) => ResponseUtil.unauthorized(res, message);

  res.forbidden = (message?: string) => ResponseUtil.forbidden(res, message);

  res.conflict = (message?: string, details?: any) => ResponseUtil.conflict(res, message, details);

  res.rateLimited = (message?: string, retryAfter?: number) => ResponseUtil.rateLimited(res, message, retryAfter);

  res.serviceUnavailable = (message?: string) => ResponseUtil.serviceUnavailable(res, message);

  res.paginated = (data: any[], page: number, limit: number, total: number, message?: string) => ResponseUtil.paginated(res, data, page, limit, total, message);

  res.created = (data: any, message?: string) => ResponseUtil.created(res, data, message);

  res.accepted = (data: any, message?: string) => ResponseUtil.accepted(res, data, message);

  res.noContent = () => ResponseUtil.noContent(res);

  next();
};
