/**
 * Prisma Accelerate Caching Utilities
 *
 * This module provides utilities for optimized caching with Prisma Accelerate.
 * It includes common cache strategies and TTL configurations.
 */

export const CacheStrategies = {
  // User data - cache for 10 minutes (users don't change frequently)
  USER_DATA: {
    ttl: 600,
  },

  // Authentication sessions - cache for 5 minutes (balance between performance and security)
  AUTH_SESSION: {
    ttl: 300,
  },

  // Email lookups - cache for 5 minutes (for login/registration checks)
  EMAIL_LOOKUP: {
    ttl: 300,
  },

  // Analysis results - cache for 1 hour (expensive to compute)
  ANALYSIS_RESULTS: {
    ttl: 3600,
  },

  // Platform connections - cache for 15 minutes (OAuth tokens change occasionally)
  PLATFORM_CONNECTIONS: {
    ttl: 900,
  },

  // Posts and comments - cache for 30 minutes (relatively static)
  CONTENT_DATA: {
    ttl: 1800,
  },

  // Short-term cache for frequently accessed data
  SHORT_TERM: {
    ttl: 60,
  },

  // Long-term cache for rarely changing data
  LONG_TERM: {
    ttl: 7200, // 2 hours
  },
} as const;

/**
 * Cache tags for better cache invalidation
 */
export const CacheTags = {
  USER: "user",
  SESSION: "session",
  ANALYSIS: "analysis",
  PLATFORM: "platform",
  CONTENT: "content",
} as const;

/**
 * Helper function to create cache strategy with tags
 */
export function createCacheStrategy(ttl: number, tags?: string[]) {
  return {
    ttl,
    ...(tags && { tags }),
  };
}

/**
 * Common cache configurations for different data types
 */
export const CommonCacheConfigs = {
  // For user profile data
  userProfile: () => createCacheStrategy(CacheStrategies.USER_DATA.ttl, [CacheTags.USER]),

  // For authentication sessions
  authSession: () => createCacheStrategy(CacheStrategies.AUTH_SESSION.ttl, [CacheTags.SESSION]),

  // For analysis results
  analysisResults: () => createCacheStrategy(CacheStrategies.ANALYSIS_RESULTS.ttl, [CacheTags.ANALYSIS]),

  // For platform connections
  platformConnections: () => createCacheStrategy(CacheStrategies.PLATFORM_CONNECTIONS.ttl, [CacheTags.PLATFORM]),

  // For content data (posts, comments)
  contentData: () => createCacheStrategy(CacheStrategies.CONTENT_DATA.ttl, [CacheTags.CONTENT]),
} as const;

/**
 * Utility to get cache TTL based on environment
 */
export function getEnvironmentCacheTtl(baseTtl: number): number {
  const env = process.env.NODE_ENV;

  switch (env) {
    case "development":
      return Math.min(baseTtl, 300); // Max 5 minutes in development
    case "test":
      return 10; // Very short cache in tests
    case "production":
      return baseTtl; // Full cache in production
    default:
      return baseTtl;
  }
}

/**
 * Create environment-aware cache strategy
 */
export function createEnvCacheStrategy(ttl: number, tags?: string[]) {
  return createCacheStrategy(getEnvironmentCacheTtl(ttl), tags);
}
