/**
 * Authentication hooks using TanStack Query
 * Provides reactive authentication state management with caching
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, handleQueryError } from "@/lib/query-client";

/**
 * Hook for user authentication state
 */
export function useAuth() {
  // Get current user profile
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const response = await apiClient.getProfile();
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch profile");
      }
      return response.data!.user;
    },
    enabled: true, // Always try to fetch profile with cookie-based auth
    retry: false, // Don't retry auth failures
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent loops
    throwOnError: false, // Don't throw errors, handle them gracefully
  });

  return {
    // State
    user,
    isAuthenticated: !!user, // With cookies, just check if user exists
    isLoading,
    isError,
    error: error ? handleQueryError(error) : null,
  };
}
