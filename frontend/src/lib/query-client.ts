/**
 * TanStack Query configuration and setup
 * Provides centralized query client with proper defaults and error handling
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";

// Default query options for consistent behavior across the app
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes - data is considered fresh for 5 minutes
    staleTime: 1000 * 60 * 5,

    // Cache time: 10 minutes - data stays in cache for 10 minutes after becoming unused
    gcTime: 1000 * 60 * 10,

    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && "code" in error && typeof error.code === "number" && error.code >= 400 && error.code < 500) {
        return false;
      }
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for real-time data
    refetchOnWindowFocus: true,

    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,

    // Retry delay for mutations
    retryDelay: 1000,
  },
};

/**
 * Create a new QueryClient instance with our configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Query keys factory for consistent key management
 * This helps with cache invalidation and prevents key conflicts
 */
export const queryKeys = {
  // Authentication
  auth: {
    profile: ["auth", "profile"] as const,
  },

  // Platforms
  platforms: {
    all: ["platforms"] as const,
    connected: ["platforms", "connected"] as const,
    posts: (platform?: string) => ["platforms", "posts", platform] as const,
  },

  // Posts
  posts: {
    all: ["posts"] as const,
    detail: (id: string) => ["posts", id] as const,
    byPlatform: (platform: string) => ["posts", "platform", platform] as const,
  },

  // Analysis
  analysis: {
    all: ["analysis"] as const,
    history: ["analysis", "history"] as const,
    result: (id: string) => ["analysis", "result", id] as const,
    status: (jobId: string) => ["analysis", "status", jobId] as const,
    comparison: (ids: string[]) => ["analysis", "comparison", ...ids.sort()] as const,
  },
} as const;

/**
 * Error handler for queries
 */
export function handleQueryError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Success handler for mutations
 */
export function handleMutationSuccess(message: string = "Operation completed successfully") {
  // This can be extended to show toast notifications
  console.log(message);
}
