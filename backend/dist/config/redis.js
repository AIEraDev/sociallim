"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.disconnectRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
let redisClient = null;
exports.redisClient = redisClient;
const connectRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    try {
        exports.redisClient = redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || "redis://localhost:6379",
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
            },
        });
        redisClient.on("error", (err) => {
            console.error("Redis Client Error:", err);
        });
        redisClient.on("connect", () => {
            console.log("Redis Client Connected");
        });
        redisClient.on("ready", () => {
            console.log("Redis Client Ready");
        });
        redisClient.on("end", () => {
            console.log("Redis Client Disconnected");
        });
        await redisClient.connect();
        return redisClient;
    }
    catch (error) {
        console.error("Failed to connect to Redis:", error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client is not connected. Call connectRedis() first.");
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
        exports.redisClient = redisClient = null;
    }
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=redis.js.map