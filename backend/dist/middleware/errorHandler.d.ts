import { Request, Response, NextFunction } from "express";
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: string;
    retryable?: boolean;
    context?: Record<string, any>;
}
export declare const createError: (message: string, statusCode?: number, code?: string, retryable?: boolean, context?: Record<string, any>) => AppError;
export declare class ValidationError extends Error {
    field?: string | undefined;
    value?: any | undefined;
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message: string, field?: string | undefined, value?: any | undefined);
}
export declare class AuthenticationError extends Error {
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string);
}
export declare class AuthorizationError extends Error {
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string);
}
export declare class NotFoundError extends Error {
    resource?: string | undefined;
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string, resource?: string | undefined);
}
export declare class ConflictError extends Error {
    field?: string | undefined;
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string, field?: string | undefined);
}
export declare class RateLimitError extends Error {
    retryAfter?: number | undefined;
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string, retryAfter?: number | undefined);
}
export declare class ExternalServiceError extends Error {
    service?: string | undefined;
    originalError?: Error | undefined;
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message: string, service?: string | undefined, originalError?: Error | undefined);
}
export declare class ServiceUnavailableError extends Error {
    statusCode: number;
    isOperational: boolean;
    code: string;
    retryable: boolean;
    constructor(message?: string);
}
export declare const errorHandler: (error: AppError | Error, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map