#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

console.log("🔍 Validating backend configuration...\n");

const checks = [
  {
    name: "Environment file",
    check: () => fs.existsSync(path.join(__dirname, "..", ".env")),
    message: ".env file exists",
  },
  {
    name: "Database URL",
    check: () => !!process.env.DATABASE_URL,
    message: "DATABASE_URL is configured",
  },
  {
    name: "JWT Secret",
    check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    message: "JWT_SECRET is configured and secure (32+ characters)",
  },
  {
    name: "Encryption Key",
    check: () => process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 32,
    message: "ENCRYPTION_KEY is configured (32 characters)",
  },
  {
    name: "Redis URL",
    check: () => !!process.env.REDIS_URL,
    message: "REDIS_URL is configured",
  },
  {
    name: "OpenAI API Key",
    check: () => !!process.env.OPENAI_API_KEY,
    message: "OPENAI_API_KEY is configured",
  },
  {
    name: "Prisma Client",
    check: () => {
      try {
        require("@prisma/client");
        return true;
      } catch {
        return false;
      }
    },
    message: "Prisma Client is generated",
  },
];

let allPassed = true;

checks.forEach(({ name, check, message }) => {
  const passed = check();
  const status = passed ? "✅" : "❌";
  console.log(`${status} ${message}`);
  if (!passed) allPassed = false;
});

console.log("\n" + "=".repeat(50));

if (allPassed) {
  console.log("🎉 All configuration checks passed!");
  console.log("✅ Backend is ready for development");
} else {
  console.log("⚠️  Some configuration issues found");
  console.log("📝 Please check your .env file and run setup again if needed");
}

console.log("\n💡 Optional configurations:");
console.log(`⚡ Prisma Accelerate: ${process.env.ACCELERATE_URL ? "✅ Enabled" : "⭕ Not configured (optional)"}`);

const oauthPlatforms = ["YOUTUBE", "INSTAGRAM", "TWITTER", "TIKTOK"];
oauthPlatforms.forEach((platform) => {
  const clientId = process.env[`${platform}_CLIENT_ID`];
  const clientSecret = process.env[`${platform}_CLIENT_SECRET`];
  const configured = clientId && clientSecret;
  console.log(`🔐 ${platform} OAuth: ${configured ? "✅ Configured" : "⭕ Not configured"}`);
});

console.log("\n🚀 To start development: npm run dev");
