import { RedisClientType } from "redis";
declare let redisClient: RedisClientType | null;
export declare const connectRedis: () => Promise<RedisClientType>;
export declare const getRedisClient: () => RedisClientType;
export declare const disconnectRedis: () => Promise<void>;
export { redisClient };
//# sourceMappingURL=redis.d.ts.map