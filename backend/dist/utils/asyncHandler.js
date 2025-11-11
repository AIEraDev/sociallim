"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = exports.CircuitBreaker = exports.withRetry = exports.asyncHandler = void 0;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const withRetry = async (operation, options = {}) => {
    const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2, retryCondition = (error) => {
        return error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ETIMEDOUT" || error.message?.includes("timeout") || (error.response?.status >= 500 && error.response?.status < 600) || error.name === "ServiceUnavailableError" || error.name === "ExternalServiceError";
    }, } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts || !retryCondition(error)) {
                throw error;
            }
            const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
            console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms:`, {
                error: error instanceof Error ? error.message : String(error),
                attempt,
                maxAttempts,
                delay,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};
exports.withRetry = withRetry;
class CircuitBreaker {
    constructor(failureThreshold = 5, recoveryTimeout = 60000, monitoringPeriod = 120000) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.monitoringPeriod = monitoringPeriod;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = "CLOSED";
    }
    async execute(operation) {
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                this.state = "HALF_OPEN";
            }
            else {
                throw new Error("Circuit breaker is OPEN - service unavailable");
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = "CLOSED";
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = "OPEN";
        }
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
const withTimeout = (operation, timeoutMs, timeoutMessage = "Operation timed out") => {
    return Promise.race([
        operation(),
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);
        }),
    ]);
};
exports.withTimeout = withTimeout;
//# sourceMappingURL=asyncHandler.js.map