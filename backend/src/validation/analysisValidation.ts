import Joi from "joi";
import { Platform } from "@prisma/client";

/**
 * Validation schema for starting analysis
 */
export const startAnalysisSchema = Joi.object({
  postId: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Post ID cannot be empty",
    "string.min": "Post ID is required",
    "string.max": "Post ID is too long",
    "any.required": "Post ID is required",
  }),

  options: Joi.object({
    includeSpam: Joi.boolean().optional().default(false),
    maxComments: Joi.number().integer().min(1).max(10000).optional().default(1000),
    analysisDepth: Joi.string().valid("basic", "detailed", "comprehensive").optional().default("detailed"),
  }).optional(),
});

/**
 * Validation schema for analysis export
 */
export const exportAnalysisSchema = Joi.object({
  analysisId: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Analysis ID cannot be empty",
    "string.min": "Analysis ID is required",
    "string.max": "Analysis ID is too long",
    "any.required": "Analysis ID is required",
  }),

  format: Joi.string().valid("pdf", "csv", "json", "xlsx").required().messages({
    "any.only": "Format must be one of: pdf, csv, json, xlsx",
    "any.required": "Export format is required",
  }),

  options: Joi.object({
    includeRawData: Joi.boolean().optional().default(false),
    includeCharts: Joi.boolean().optional().default(true),
    dateRange: Joi.object({
      start: Joi.date().iso().optional(),
      end: Joi.date().iso().min(Joi.ref("start")).optional(),
    }).optional(),
  }).optional(),
});

/**
 * Validation schema for analysis comparison
 */
export const compareAnalysisSchema = Joi.object({
  analysisIds: Joi.array().items(Joi.string().trim().min(1).max(100).required()).min(2).max(10).unique().required().messages({
    "array.min": "At least 2 analyses are required for comparison",
    "array.max": "Cannot compare more than 10 analyses at once",
    "array.unique": "Duplicate analysis IDs are not allowed",
    "any.required": "Analysis IDs are required",
  }),

  comparisonType: Joi.string().valid("sentiment", "themes", "keywords", "comprehensive").optional().default("comprehensive"),

  options: Joi.object({
    includeTimeline: Joi.boolean().optional().default(true),
    groupBy: Joi.string().valid("platform", "date", "sentiment").optional(),
  }).optional(),
});

/**
 * Validation schema for pagination parameters
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "title", "platform").optional().default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").optional().default("desc"),
});

/**
 * Validation schema for analysis history filters
 */
export const analysisHistorySchema = paginationSchema.keys({
  platform: Joi.string()
    .valid(...Object.values(Platform))
    .optional(),

  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional(),

  status: Joi.string().valid("pending", "processing", "completed", "failed").optional(),

  search: Joi.string().trim().max(100).optional(),
});

/**
 * Validation middleware factory
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true, // Convert string numbers to actual numbers
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

/**
 * Validation for URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
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

/**
 * Common parameter schemas
 */
export const idParamSchema = Joi.object({
  id: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "ID cannot be empty",
    "string.min": "ID is required",
    "string.max": "ID is too long",
    "any.required": "ID is required",
  }),
});

export const platformParamSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform).map((p) => p.toLowerCase()))
    .required()
    .messages({
      "any.only": `Platform must be one of: ${Object.values(Platform)
        .map((p) => p.toLowerCase())
        .join(", ")}`,
      "any.required": "Platform is required",
    }),
});
