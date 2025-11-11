import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";

// Set required environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || "prisma+postgres://accelerate.prisma-data.net/?api_key=test-key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-12345";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-api-key";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // 32 chars

// OAuth test credentials
process.env.YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "test-youtube-client-id";
process.env.YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "test-youtube-client-secret";
process.env.INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || "test-instagram-client-id";
process.env.INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || "test-instagram-client-secret";
process.env.TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || "test-twitter-client-id";
process.env.TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || "test-twitter-client-secret";
process.env.TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID || "test-tiktok-client-id";
process.env.TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "test-tiktok-client-secret";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-openai-api-key";

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
