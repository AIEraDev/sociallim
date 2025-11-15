import dotenv from "dotenv";
import Joi from "joi";

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(5628),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5628"),

  // Database - Using Prisma Accelerate
  DATABASE_URL: Joi.string().required(),
  DIRECT_DATABASE_URL: Joi.string().optional(), // Only needed for migrations

  // Prisma Accelerate Caching
  PRISMA_CACHE_TTL: Joi.number().default(300),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),

  // OAuth - YouTube
  YOUTUBE_CLIENT_ID: Joi.string().required(),
  YOUTUBE_CLIENT_SECRET: Joi.string().required(),

  // OAuth - Instagram
  INSTAGRAM_CLIENT_ID: Joi.string().required(),
  INSTAGRAM_CLIENT_SECRET: Joi.string().required(),

  // OAuth - Twitter/X
  TWITTER_CLIENT_ID: Joi.string().required(),
  TWITTER_CLIENT_SECRET: Joi.string().required(),

  // OAuth - TikTok
  TIKTOK_CLIENT_ID: Joi.string().required(),
  TIKTOK_CLIENT_SECRET: Joi.string().required(),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default("gpt-4"),

  // Encryption
  ENCRYPTION_KEY: Joi.string().length(32).required(),

  // Email Configuration
  EMAIL_PROVIDER: Joi.string().valid("nodemailer", "mailtrap", "resend", "console").default("nodemailer"),

  // Nodemailer (SMTP)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),

  // Resend
  RESEND_API_KEY: Joi.string().optional(),

  // Mailtrap
  MAILTRAP_TOKEN: Joi.string().optional(),
  MAILTRAP_ACCOUNT_ID: Joi.string().optional(),

  FROM_EMAIL: Joi.string().email().default("noreply@echomind.ai"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,

  database: {
    url: envVars.DATABASE_URL,
    directUrl: envVars.DIRECT_DATABASE_URL, // Only used for migrations
  },

  prisma: {
    cacheTtl: envVars.PRISMA_CACHE_TTL || 300, // Default 5 minutes
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },

  oauth: {
    youtube: {
      clientId: envVars.YOUTUBE_CLIENT_ID,
      clientSecret: envVars.YOUTUBE_CLIENT_SECRET,
    },
    instagram: {
      clientId: envVars.INSTAGRAM_CLIENT_ID,
      clientSecret: envVars.INSTAGRAM_CLIENT_SECRET,
    },
    twitter: {
      clientId: envVars.TWITTER_CLIENT_ID,
      clientSecret: envVars.TWITTER_CLIENT_SECRET,
    },
    tiktok: {
      clientId: envVars.TIKTOK_CLIENT_ID,
      clientSecret: envVars.TIKTOK_CLIENT_SECRET,
    },
  },

  openai: {
    apiKey: envVars.OPENAI_API_KEY,
    model: envVars.OPENAI_MODEL,
  },

  encryption: {
    key: envVars.ENCRYPTION_KEY,
  },

  email: {
    provider: envVars.EMAIL_PROVIDER,
    fromEmail: envVars.FROM_EMAIL,
    nodemailer: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT || 587,
      secure: envVars.SMTP_SECURE,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
    },
    resend: {
      apiKey: envVars.RESEND_API_KEY,
    },
    mailtrap: {
      token: envVars.MAILTRAP_TOKEN,
      accountId: envVars.MAILTRAP_ACCOUNT_ID,
    },
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
};
