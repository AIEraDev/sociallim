"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformParamSchema = exports.idParamSchema = exports.validateParams = exports.validateQuery = exports.analysisHistorySchema = exports.paginationSchema = exports.compareAnalysisSchema = exports.exportAnalysisSchema = exports.startAnalysisSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
exports.startAnalysisSchema = joi_1.default.object({
    postId: joi_1.default.string().trim().min(1).max(100).required().messages({
        "string.empty": "Post ID cannot be empty",
        "string.min": "Post ID is required",
        "string.max": "Post ID is too long",
        "any.required": "Post ID is required",
    }),
    options: joi_1.default.object({
        includeSpam: joi_1.default.boolean().optional().default(false),
        maxComments: joi_1.default.number().integer().min(1).max(10000).optional().default(1000),
        analysisDepth: joi_1.default.string().valid("basic", "detailed", "comprehensive").optional().default("detailed"),
    }).optional(),
});
exports.exportAnalysisSchema = joi_1.default.object({
    analysisId: joi_1.default.string().trim().min(1).max(100).required().messages({
        "string.empty": "Analysis ID cannot be empty",
        "string.min": "Analysis ID is required",
        "string.max": "Analysis ID is too long",
        "any.required": "Analysis ID is required",
    }),
    format: joi_1.default.string().valid("pdf", "csv", "json", "xlsx").required().messages({
        "any.only": "Format must be one of: pdf, csv, json, xlsx",
        "any.required": "Export format is required",
    }),
    options: joi_1.default.object({
        includeRawData: joi_1.default.boolean().optional().default(false),
        includeCharts: joi_1.default.boolean().optional().default(true),
        dateRange: joi_1.default.object({
            start: joi_1.default.date().iso().optional(),
            end: joi_1.default.date().iso().min(joi_1.default.ref("start")).optional(),
        }).optional(),
    }).optional(),
});
exports.compareAnalysisSchema = joi_1.default.object({
    analysisIds: joi_1.default.array().items(joi_1.default.string().trim().min(1).max(100).required()).min(2).max(10).unique().required().messages({
        "array.min": "At least 2 analyses are required for comparison",
        "array.max": "Cannot compare more than 10 analyses at once",
        "array.unique": "Duplicate analysis IDs are not allowed",
        "any.required": "Analysis IDs are required",
    }),
    comparisonType: joi_1.default.string().valid("sentiment", "themes", "keywords", "comprehensive").optional().default("comprehensive"),
    options: joi_1.default.object({
        includeTimeline: joi_1.default.boolean().optional().default(true),
        groupBy: joi_1.default.string().valid("platform", "date", "sentiment").optional(),
    }).optional(),
});
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(20),
    sortBy: joi_1.default.string().valid("createdAt", "updatedAt", "title", "platform").optional().default("createdAt"),
    sortOrder: joi_1.default.string().valid("asc", "desc").optional().default("desc"),
});
exports.analysisHistorySchema = exports.paginationSchema.keys({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform))
        .optional(),
    dateFrom: joi_1.default.date().iso().optional(),
    dateTo: joi_1.default.date().iso().min(joi_1.default.ref("dateFrom")).optional(),
    status: joi_1.default.string().valid("pending", "processing", "completed", "failed").optional(),
    search: joi_1.default.string().trim().max(100).optional(),
});
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));
            return res.status(400).json({
                error: "Validation failed",
                message: "Invalid query parameters",
                details: errors,
            });
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));
            return res.status(400).json({
                error: "Validation failed",
                message: "Invalid URL parameters",
                details: errors,
            });
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
exports.idParamSchema = joi_1.default.object({
    id: joi_1.default.string().trim().min(1).max(100).required().messages({
        "string.empty": "ID cannot be empty",
        "string.min": "ID is required",
        "string.max": "ID is too long",
        "any.required": "ID is required",
    }),
});
exports.platformParamSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform).map((p) => p.toLowerCase()))
        .required()
        .messages({
        "any.only": `Platform must be one of: ${Object.values(client_1.Platform)
            .map((p) => p.toLowerCase())
            .join(", ")}`,
        "any.required": "Platform is required",
    }),
});
//# sourceMappingURL=analysisValidation.js.map