"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid("development", "production", "test").default("development"),
    PORT: joi_1.default.number().default(5628),
    FRONTEND_URL: joi_1.default.string().uri().default("http://localhost:5628"),
    DATABASE_URL: joi_1.default.string().required(),
    DIRECT_DATABASE_URL: joi_1.default.string().optional(),
    PRISMA_CACHE_TTL: joi_1.default.number().default(300),
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRES_IN: joi_1.default.string().default("7d"),
    YOUTUBE_CLIENT_ID: joi_1.default.string().required(),
    YOUTUBE_CLIENT_SECRET: joi_1.default.string().required(),
    INSTAGRAM_CLIENT_ID: joi_1.default.string().required(),
    INSTAGRAM_CLIENT_SECRET: joi_1.default.string().required(),
    TWITTER_CLIENT_ID: joi_1.default.string().required(),
    TWITTER_CLIENT_SECRET: joi_1.default.string().required(),
    TIKTOK_CLIENT_ID: joi_1.default.string().required(),
    TIKTOK_CLIENT_SECRET: joi_1.default.string().required(),
    OPENAI_API_KEY: joi_1.default.string().required(),
    OPENAI_MODEL: joi_1.default.string().default("gpt-4"),
    ENCRYPTION_KEY: joi_1.default.string().length(32).required(),
    EMAIL_PROVIDER: joi_1.default.string().valid("nodemailer", "mailtrap", "resend", "console").default("nodemailer"),
    SMTP_HOST: joi_1.default.string().optional(),
    SMTP_PORT: joi_1.default.number().optional(),
    SMTP_SECURE: joi_1.default.boolean().default(false),
    SMTP_USER: joi_1.default.string().optional(),
    SMTP_PASS: joi_1.default.string().optional(),
    RESEND_API_KEY: joi_1.default.string().optional(),
    MAILTRAP_TOKEN: joi_1.default.string().optional(),
    MAILTRAP_ACCOUNT_ID: joi_1.default.string().optional(),
    FROM_EMAIL: joi_1.default.string().email().default("noreply@echomind.ai"),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().default(100),
}).unknown();
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
exports.config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    frontendUrl: envVars.FRONTEND_URL,
    database: {
        url: envVars.DATABASE_URL,
        directUrl: envVars.DIRECT_DATABASE_URL,
    },
    prisma: {
        cacheTtl: envVars.PRISMA_CACHE_TTL || 300,
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
//# sourceMappingURL=environment.js.map