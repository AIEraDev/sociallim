/**
 * Environment variables configuration and validation
 * Provides type-safe access to environment variables
 */

/**
 * Client-side environment variables
 * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_
 */
export const env = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",

  // Application Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "EchoMind",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  // Optional: Analytics and Monitoring
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const requiredVars = {
    API_URL: env.API_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }
}

// Validate environment variables on module load
if (typeof window !== "undefined") {
  validateEnv();
}
