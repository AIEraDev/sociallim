import { Request, Response, NextFunction } from "express";
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
}
export declare const withRetry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<T>;
export declare class CircuitBreaker {
    private failureThreshold;
    private recoveryTimeout;
    private monitoringPeriod;
    private failures;
    private lastFailureTime;
    private state;
    constructor(failureThreshold?: number, recoveryTimeout?: number, monitoringPeriod?: number);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): {
        state: "CLOSED" | "OPEN" | "HALF_OPEN";
        failures: number;
        lastFailureTime: number;
    };
}
export declare const withTimeout: <T>(operation: () => Promise<T>, timeoutMs: number, timeoutMessage?: string) => Promise<T>;
//# sourceMappingURL=asyncHandler.d.ts.map