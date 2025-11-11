/**
 * Platform connection hooks using TanStack Query
 * Manages social media platform connections and posts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, handleQueryError } from "@/lib/query-client";
import { Platform } from "@/types";

/**
 * Hook for managing platform connections
 */
export function usePlatforms() {
  const queryClient = useQueryClient();

  // Get connected platforms
  const {
    data: connectedPlatforms = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.platforms.connected,
    queryFn: async () => {
      const response = await apiClient.getConnectedPlatforms();
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch connected platforms");
      }
      return response.data!;
    },
  });

  // Connect platform mutation
  const connectPlatformMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      const response = await apiClient.connectPlatform(platform);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to connect platform");
      }
      return response.data!;
    },
    onSuccess: (data, platform) => {
      console.log(platform);
      // Redirect to OAuth URL
      if (typeof window !== "undefined") {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      console.error("Platform connection error:", error);
    },
  });

  // Disconnect platform mutation
  const disconnectPlatformMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      const response = await apiClient.disconnectPlatform(platform);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to disconnect platform");
      }
      return response.data!;
    },
    onSuccess: () => {
      // Invalidate connected platforms to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.platforms.connected });

      // Also invalidate posts since they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.platforms.posts() });
    },
    onError: (error) => {
      console.error("Platform disconnection error:", error);
    },
  });

  // Helper function to check if a platform is connected
  const isPlatformConnected = (platform: Platform): boolean => {
    return connectedPlatforms.some((cp) => cp.platform === platform);
  };

  // Get platform connection status
  const getPlatformStatus = (platform: Platform) => {
    const connection = connectedPlatforms.find((cp) => cp.platform === platform);
    return {
      isConnected: !!connection,
      connectedAt: connection?.connectedAt,
      platformUserId: connection?.platformUserId,
    };
  };

  return {
    // State
    connectedPlatforms,
    isLoading,
    error: error ? handleQueryError(error) : null,

    // Actions
    connectPlatform: connectPlatformMutation.mutate,
    disconnectPlatform: disconnectPlatformMutation.mutate,
    refetch,

    // Helpers
    isPlatformConnected,
    getPlatformStatus,

    // Mutation states
    isConnecting: connectPlatformMutation.isPending,
    isDisconnecting: disconnectPlatformMutation.isPending,

    connectError: connectPlatformMutation.error ? handleQueryError(connectPlatformMutation.error) : null,
    disconnectError: disconnectPlatformMutation.error ? handleQueryError(disconnectPlatformMutation.error) : null,
  };
}

/**
 * Hook for fetching user posts from connected platforms
 */
export function usePosts(platform?: Platform) {
  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.platforms.posts(platform),
    queryFn: async () => {
      const response = await apiClient.getUserPosts(platform);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch posts");
      }
      return response.data!;
    },
    // Only fetch if we have connected platforms
    enabled: true,
  });

  return {
    posts,
    isLoading,
    error: error ? handleQueryError(error) : null,
    refetch,
  };
}

/**
 * Hook for fetching a specific post
 */
export function usePost(postId: string) {
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: async () => {
      const response = await apiClient.getPost(postId);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch post");
      }
      return response.data!;
    },
    enabled: !!postId,
  });

  return {
    post,
    isLoading,
    error: error ? handleQueryError(error) : null,
    refetch,
  };
}
