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
export declare class ResponseUtil {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: ApiResponse<T>["meta"]): void;
    static error(res: Response, message: string, statusCode?: number, code?: string, details?: any, retryable?: boolean, correlationId?: string): void;
    static validationError(res: Response, errors: any, message?: string): void;
    static notFound(res: Response, resource?: string, message?: string): void;
    static unauthorized(res: Response, message?: string): void;
    static forbidden(res: Response, message?: string): void;
    static conflict(res: Response, message?: string, details?: any): void;
    static rateLimited(res: Response, message?: string, retryAfter?: number): void;
    static serviceUnavailable(res: Response, message?: string): void;
    static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): void;
    static created<T>(res: Response, data: T, message?: string): void;
    static accepted<T>(res: Response, data: T, message?: string): void;
    static noContent(res: Response): void;
}
export declare const addResponseUtils: (req: any, res: any, next: any) => void;
//# sourceMappingURL=response.d.ts.map