import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Create a singleton Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Configure Prisma client with Accelerate support
const createPrismaClient = () => {
  // Ensure we're using the Accelerate URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.includes("prisma+")) {
    console.warn("⚠️  DATABASE_URL should use 'prisma+postgres://' for Accelerate benefits");
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }).$extends(withAccelerate());

  // Log Accelerate status
  if (databaseUrl?.includes("prisma+")) {
    console.log("✅ Prisma Accelerate enabled for caching and connection pooling");
    console.log("🚀 Using optimized connection pooling and query caching");
  } else {
    console.log("⚠️  Using direct database connection (no Accelerate benefits)");
  }

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Test database connection function
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
};
