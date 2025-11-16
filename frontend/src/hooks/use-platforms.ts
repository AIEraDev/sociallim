/**
 * Platform connection hooks using TanStack Query
 * Manages social media platform connections and posts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, handleQueryError } from "@/lib/query-client";
import { Platform, Post } from "@/types";
import { toast } from "sonner";

/**
 * Hook for managing platform connections
 */
export function usePlatforms(enabled = false) {
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
    enabled,
  });

  // Connect platform mutation
  const connectPlatformMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      const response = await apiClient.connectPlatform(platform);
      const data = await response.json();
      if (!response.ok) {
        console.log("OAUTH ERROR: ", data);
        throw new Error(data);
      }
      return data;
    },
    onSuccess: (data) => {
      console.log(data);
      // // Redirect to OAuth URL
      if (typeof window !== "undefined") {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      console.error("Platform connection error:", error);
      toast.error("Failed to connect platform. Please try again.");
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
    // isConnectingTwitter: connectTwitterPlatformMutation.isPending,

    connectError: connectPlatformMutation.error ? handleQueryError(connectPlatformMutation.error) : null,
    disconnectError: disconnectPlatformMutation.error ? handleQueryError(disconnectPlatformMutation.error) : null,
  };
}

export interface PostsInterface {
  source: "live" | "db";
  platform: Platform;
  totalPosts: number;
  posts: Post[];
}

/**
 * Hook for fetching user posts from connected platforms
 */
export function usePlatformPosts(platform?: Platform) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.platforms.posts(platform),
    queryFn: async () => {
      return await apiClient.getUserPlatformPosts(platform);
    },
    // Only fetch if we have connected platforms
    enabled: !!platform,
  });

  return {
    postsData: data,
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
