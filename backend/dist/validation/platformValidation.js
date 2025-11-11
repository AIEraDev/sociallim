"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookConfigSchema = exports.platformStatusSchema = exports.refreshTokenSchema = exports.fetchPostsSchema = exports.oauthCallbackSchema = exports.connectPlatformSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
exports.connectPlatformSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform))
        .required()
        .messages({
        "any.only": `Platform must be one of: ${Object.values(client_1.Platform).join(", ")}`,
        "any.required": "Platform is required",
    }),
    redirectUrl: joi_1.default.string()
        .uri({ scheme: ["http", "https"] })
        .optional()
        .messages({
        "string.uri": "Redirect URL must be a valid HTTP/HTTPS URL",
    }),
});
exports.oauthCallbackSchema = joi_1.default.object({
    code: joi_1.default.string().trim().min(1).required().messages({
        "string.empty": "Authorization code cannot be empty",
        "string.min": "Authorization code is required",
        "any.required": "Authorization code is required",
    }),
    state: joi_1.default.string().trim().optional().messages({
        "string.empty": "State parameter cannot be empty",
    }),
    error: joi_1.default.string().trim().optional().messages({
        "string.empty": "Error parameter cannot be empty",
    }),
    error_description: joi_1.default.string().trim().optional().messages({
        "string.empty": "Error description cannot be empty",
    }),
});
exports.fetchPostsSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform))
        .optional()
        .messages({
        "any.only": `Platform must be one of: ${Object.values(client_1.Platform).join(", ")}`,
    }),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(20).messages({
        "number.base": "Limit must be a number",
        "number.integer": "Limit must be an integer",
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
    }),
    offset: joi_1.default.number().integer().min(0).optional().default(0).messages({
        "number.base": "Offset must be a number",
        "number.integer": "Offset must be an integer",
        "number.min": "Offset cannot be negative",
    }),
    sortBy: joi_1.default.string().valid("publishedAt", "title", "platform").optional().default("publishedAt").messages({
        "any.only": "Sort field must be one of: publishedAt, title, platform",
    }),
    sortOrder: joi_1.default.string().valid("asc", "desc").optional().default("desc").messages({
        "any.only": "Sort order must be either 'asc' or 'desc'",
    }),
    search: joi_1.default.string().trim().max(100).optional().messages({
        "string.max": "Search query cannot exceed 100 characters",
    }),
    dateFrom: joi_1.default.date().iso().optional().messages({
        "date.format": "Date must be in ISO format (YYYY-MM-DD)",
    }),
    dateTo: joi_1.default.date().iso().min(joi_1.default.ref("dateFrom")).optional().messages({
        "date.format": "Date must be in ISO format (YYYY-MM-DD)",
        "date.min": "End date must be after start date",
    }),
});
exports.refreshTokenSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform))
        .required()
        .messages({
        "any.only": `Platform must be one of: ${Object.values(client_1.Platform).join(", ")}`,
        "any.required": "Platform is required",
    }),
    force: joi_1.default.boolean().optional().default(false).messages({
        "boolean.base": "Force parameter must be a boolean",
    }),
});
exports.platformStatusSchema = joi_1.default.object({
    platforms: joi_1.default.array()
        .items(joi_1.default.string().valid(...Object.values(client_1.Platform)))
        .optional()
        .unique()
        .messages({
        "array.unique": "Duplicate platforms are not allowed",
        "any.only": `Each platform must be one of: ${Object.values(client_1.Platform).join(", ")}`,
    }),
    includeTokenStatus: joi_1.default.boolean().optional().default(true).messages({
        "boolean.base": "Include token status must be a boolean",
    }),
});
exports.webhookConfigSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform))
        .required()
        .messages({
        "any.only": `Platform must be one of: ${Object.values(client_1.Platform).join(", ")}`,
        "any.required": "Platform is required",
    }),
    webhookUrl: joi_1.default.string()
        .uri({ scheme: ["http", "https"] })
        .required()
        .messages({
        "string.uri": "Webhook URL must be a valid HTTP/HTTPS URL",
        "any.required": "Webhook URL is required",
    }),
    events: joi_1.default.array().items(joi_1.default.string().valid("comment.created", "comment.updated", "comment.deleted", "post.updated")).min(1).unique().required().messages({
        "array.min": "At least one event type must be specified",
        "array.unique": "Duplicate event types are not allowed",
        "any.only": "Event type must be one of: comment.created, comment.updated, comment.deleted, post.updated",
        "any.required": "Event types are required",
    }),
    secret: joi_1.default.string().trim().min(16).max(128).optional().messages({
        "string.min": "Webhook secret must be at least 16 characters",
        "string.max": "Webhook secret cannot exceed 128 characters",
    }),
});
//# sourceMappingURL=platformValidation.js.map