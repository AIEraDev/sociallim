"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(data) {
        super(data.message);
        this.name = "ApiError";
        this.code = data.code;
        this.status = data.status;
        this.platform = data.platform;
        this.retryAfter = data.retryAfter;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=socialMedia.js.map