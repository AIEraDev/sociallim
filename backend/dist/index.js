"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const response_1 = require("./utils/response");
const security_1 = require("./middleware/security");
const rateLimiter_1 = require("./middleware/rateLimiter");
const sanitization_1 = require("./utils/sanitization");
const database_1 = require("./config/database");
const environment_1 = require("./config/environment");
const oauth_1 = require("./config/oauth");
const encryption_1 = require("./utils/encryption");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = environment_1.config.port;
app.use((0, security_1.setupSecurity)());
app.use(rateLimiter_1.generalRateLimit);
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, sanitization_1.sanitizeRequestBody)());
app.use((0, express_session_1.default)({
    secret: environment_1.config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: environment_1.config.env === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
app.use(oauth_1.passport.initialize());
app.use(oauth_1.passport.session());
app.use(response_1.addResponseUtils);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "comment-sentiment-analyzer-backend",
    });
});
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const oauthRoutes_1 = require("./routes/oauthRoutes");
const tokenRoutes_1 = require("./routes/tokenRoutes");
const platformRoutes_1 = __importDefault(require("./routes/platformRoutes"));
const analysisRoutes_1 = __importDefault(require("./routes/analysisRoutes"));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/oauth", oauthRoutes_1.oauthRoutes);
app.use("/api/tokens", tokenRoutes_1.tokenRoutes);
app.use("/api/platforms", platformRoutes_1.default);
app.use("/api/analysis", analysisRoutes_1.default);
app.use("/api", (req, res) => {
    res.status(200).json({
        message: "Comment Sentiment Analyzer API",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            auth: "/api/auth",
            oauth: "/api/oauth",
            tokens: "/api/tokens",
            platforms: "/api/platforms",
            analysis: "/api/analysis",
        },
    });
});
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await database_1.prisma.$disconnect();
    process.exit(0);
});
process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await database_1.prisma.$disconnect();
    process.exit(0);
});
async function startServer() {
    try {
        console.log("🚀 Starting Comment Sentiment Analyzer Backend...");
        console.log(`📝 Environment: ${environment_1.config.env}`);
        (0, encryption_1.validateEncryptionKey)();
        console.log("✅ Encryption key validated");
        const dbConnected = await (0, database_1.testDatabaseConnection)();
        if (!dbConnected) {
            throw new Error("Database connection failed");
        }
        console.log("✅ Database connected successfully");
        if (process.env.DATABASE_URL?.includes("prisma+")) {
            console.log("⚡ Prisma Accelerate enabled for enhanced performance");
        }
        else {
            console.log("📊 Using direct database connection");
        }
        app.listen(PORT, () => {
            console.log(`🚀 Backend server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base: http://localhost:${PORT}/api`);
            console.log(`🌐 Frontend URL: ${environment_1.config.frontendUrl}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map