"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const globalForPrisma = globalThis;
const createPrismaClient = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl?.includes("prisma+")) {
        console.warn("⚠️  DATABASE_URL should use 'prisma+postgres://' for Accelerate benefits");
    }
    const client = new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        errorFormat: "pretty",
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    }).$extends((0, extension_accelerate_1.withAccelerate)());
    if (databaseUrl?.includes("prisma+")) {
        console.log("✅ Prisma Accelerate enabled for caching and connection pooling");
        console.log("🚀 Using optimized connection pooling and query caching");
    }
    else {
        console.log("⚠️  Using direct database connection (no Accelerate benefits)");
    }
    return client;
};
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
process.on("beforeExit", async () => {
    await exports.prisma.$disconnect();
});
const testDatabaseConnection = async () => {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error("Database connection test failed:", error);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
//# sourceMappingURL=database.js.map