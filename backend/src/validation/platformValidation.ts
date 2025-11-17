import Joi from "joi";
import { Platform } from "@prisma/client";

/*** Validation schemas ***/
export const platformParamSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform).map((p) => p.toLowerCase()))
    .required()
    .messages({
      "any.only": "Platform must be one of: youtube, instagram, twitter, tiktok",
      "any.required": "Platform parameter is required",
    }),
});

export const startAnalysisSchema = Joi.object({
  postId: Joi.string().required().messages({
    "any.required": "Post ID is required",
  }),
});

/**
 * Validation schema for platform connection
 */
export const connectPlatformSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform))
    .required()
    .messages({
      "any.only": `Platform must be one of: ${Object.values(Platform).join(", ")}`,
      "any.required": "Platform is required",
    }),

  redirectUrl: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .optional()
    .messages({
      "string.uri": "Redirect URL must be a valid HTTP/HTTPS URL",
    }),
});

/**
 * Validation schema for OAuth callback
 */
export const oauthCallbackSchema = Joi.object({
  code: Joi.string().trim().min(1).required().messages({
    "string.empty": "Authorization code cannot be empty",
    "string.min": "Authorization code is required",
    "any.required": "Authorization code is required",
  }),

  state: Joi.string().trim().optional().messages({
    "string.empty": "State parameter cannot be empty",
  }),

  error: Joi.string().trim().optional().messages({
    "string.empty": "Error parameter cannot be empty",
  }),

  error_description: Joi.string().trim().optional().messages({
    "string.empty": "Error description cannot be empty",
  }),
});

/**
 * Validation schema for fetching posts
 */
export const fetchPostsSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform))
    .optional()
    .messages({
      "any.only": `Platform must be one of: ${Object.values(Platform).join(", ")}`,
    }),

  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  offset: Joi.number().integer().min(0).optional().default(0).messages({
    "number.base": "Offset must be a number",
    "number.integer": "Offset must be an integer",
    "number.min": "Offset cannot be negative",
  }),

  sortBy: Joi.string().valid("publishedAt", "title", "platform").optional().default("publishedAt").messages({
    "any.only": "Sort field must be one of: publishedAt, title, platform",
  }),

  sortOrder: Joi.string().valid("asc", "desc").optional().default("desc").messages({
    "any.only": "Sort order must be either 'asc' or 'desc'",
  }),

  search: Joi.string().trim().max(100).optional().messages({
    "string.max": "Search query cannot exceed 100 characters",
  }),

  dateFrom: Joi.date().iso().optional().messages({
    "date.format": "Date must be in ISO format (YYYY-MM-DD)",
  }),

  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional().messages({
    "date.format": "Date must be in ISO format (YYYY-MM-DD)",
    "date.min": "End date must be after start date",
  }),
});

/**
 * Validation schema for token refresh
 */
export const refreshTokenSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform))
    .required()
    .messages({
      "any.only": `Platform must be one of: ${Object.values(Platform).join(", ")}`,
      "any.required": "Platform is required",
    }),

  force: Joi.boolean().optional().default(false).messages({
    "boolean.base": "Force parameter must be a boolean",
  }),
});

/**
 * Validation schema for platform status check
 */
export const platformStatusSchema = Joi.object({
  platforms: Joi.array()
    .items(Joi.string().valid(...Object.values(Platform)))
    .optional()
    .unique()
    .messages({
      "array.unique": "Duplicate platforms are not allowed",
      "any.only": `Each platform must be one of: ${Object.values(Platform).join(", ")}`,
    }),

  includeTokenStatus: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Include token status must be a boolean",
  }),
});

/**
 * Validation schema for webhook configuration
 */
export const webhookConfigSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform))
    .required()
    .messages({
      "any.only": `Platform must be one of: ${Object.values(Platform).join(", ")}`,
      "any.required": "Platform is required",
    }),

  webhookUrl: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required()
    .messages({
      "string.uri": "Webhook URL must be a valid HTTP/HTTPS URL",
      "any.required": "Webhook URL is required",
    }),

  events: Joi.array().items(Joi.string().valid("comment.created", "comment.updated", "comment.deleted", "post.updated")).min(1).unique().required().messages({
    "array.min": "At least one event type must be specified",
    "array.unique": "Duplicate event types are not allowed",
    "any.only": "Event type must be one of: comment.created, comment.updated, comment.deleted, post.updated",
    "any.required": "Event types are required",
  }),

  secret: Joi.string().trim().min(16).max(128).optional().messages({
    "string.min": "Webhook secret must be at least 16 characters",
    "string.max": "Webhook secret cannot exceed 128 characters",
  }),
});
