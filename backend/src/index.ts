/**
 * - TIKTOK OAUTH
 * - TWITTER OAUTH
 * - FACEBOOK OAUTH
 * - INSTAGRAM OAUTH
 */
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { addResponseUtils } from "./utils/response";
import { setupSecurity } from "./middleware/security";
import { generalRateLimit } from "./middleware/rateLimiter";
import { sanitizeRequestBody } from "./utils/sanitization";
import { prisma, testDatabaseConnection } from "./config/database";
import { config } from "./config/environment";
import { passport } from "./config/oauth";
import { validateEncryptionKey } from "./utils/encryption";

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Security middleware
app.use(setupSecurity());

// Rate limiting
app.use(generalRateLimit);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Input sanitization
app.use(sanitizeRequestBody());

// Session configuration for OAuth (using memory store for development)
app.use(
  session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.env === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Add response utilities
app.use(addResponseUtils);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "comment-sentiment-analyzer-backend",
  });
});

// Import routes
import authRoutes from "./routes/authRoutes";
import { oauthRoutes } from "./routes/oauthRoutes";
import platformRoutes from "./routes/platformRoutes";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/platforms", platformRoutes);

// API info endpoint
app.use("/api", (_, res) => {
  res.status(200).json({
    message: "Comment Sentiment Analyzer API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      oauth: "/api/oauth",
      platforms: "/api/platforms",
      analysis: "/api/analysis",
    },
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

async function startServer() {
  try {
    console.log("🚀 Starting Comment Sentiment Analyzer Backend...");
    console.log(`📝 Environment: ${config.env}`);

    // Validate encryption key
    validateEncryptionKey();
    console.log("✅ Encryption key validated");

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }
    console.log("✅ Database connected successfully");

    // Log Prisma Accelerate status
    if (process.env.DATABASE_URL?.includes("prisma+")) {
      console.log("⚡ Prisma Accelerate enabled for enhanced performance");
    } else {
      console.log("📊 Using direct database connection");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
