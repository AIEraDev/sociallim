"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonCacheConfigs = exports.CacheTags = exports.CacheStrategies = void 0;
exports.createCacheStrategy = createCacheStrategy;
exports.getEnvironmentCacheTtl = getEnvironmentCacheTtl;
exports.createEnvCacheStrategy = createEnvCacheStrategy;
exports.CacheStrategies = {
    USER_DATA: {
        ttl: 600,
    },
    AUTH_SESSION: {
        ttl: 300,
    },
    EMAIL_LOOKUP: {
        ttl: 300,
    },
    ANALYSIS_RESULTS: {
        ttl: 3600,
    },
    PLATFORM_CONNECTIONS: {
        ttl: 900,
    },
    CONTENT_DATA: {
        ttl: 1800,
    },
    SHORT_TERM: {
        ttl: 60,
    },
    LONG_TERM: {
        ttl: 7200,
    },
};
exports.CacheTags = {
    USER: "user",
    SESSION: "session",
    ANALYSIS: "analysis",
    PLATFORM: "platform",
    CONTENT: "content",
};
function createCacheStrategy(ttl, tags) {
    return {
        ttl,
        ...(tags && { tags }),
    };
}
exports.CommonCacheConfigs = {
    userProfile: () => createCacheStrategy(exports.CacheStrategies.USER_DATA.ttl, [exports.CacheTags.USER]),
    authSession: () => createCacheStrategy(exports.CacheStrategies.AUTH_SESSION.ttl, [exports.CacheTags.SESSION]),
    analysisResults: () => createCacheStrategy(exports.CacheStrategies.ANALYSIS_RESULTS.ttl, [exports.CacheTags.ANALYSIS]),
    platformConnections: () => createCacheStrategy(exports.CacheStrategies.PLATFORM_CONNECTIONS.ttl, [exports.CacheTags.PLATFORM]),
    contentData: () => createCacheStrategy(exports.CacheStrategies.CONTENT_DATA.ttl, [exports.CacheTags.CONTENT]),
};
function getEnvironmentCacheTtl(baseTtl) {
    const env = process.env.NODE_ENV;
    switch (env) {
        case "development":
            return Math.min(baseTtl, 300);
        case "test":
            return 10;
        case "production":
            return baseTtl;
        default:
            return baseTtl;
    }
}
function createEnvCacheStrategy(ttl, tags) {
    return createCacheStrategy(getEnvironmentCacheTtl(ttl), tags);
}
//# sourceMappingURL=prismaCache.js.map