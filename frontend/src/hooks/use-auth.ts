/**
 * Authentication hooks using TanStack Query
 * Provides reactive authentication state management with caching
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, handleQueryError } from "@/lib/query-client";
import { LoginRequest, RegisterRequest, User, CookieAuthResponse } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Hook for user authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

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
      return response.data!;
    },
    enabled: true, // Always try to fetch profile with cookie-based auth
    retry: false, // Don't retry auth failures
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.login(credentials);
      if (!response.success) {
        throw new Error(response.error?.message || "Login failed");
      }
      return response.data!;
    },
    onSuccess: (data: CookieAuthResponse) => {
      // With cookie-based auth, update the profile cache with user data
      queryClient.setQueryData(queryKeys.auth.profile, data.user);

      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();

      toast.success("Welcome back!");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      toast.error(errorMessage);
      console.error("Login error:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await apiClient.register(userData);
      if (!response.success) {
        throw new Error(response.error?.message || "Registration failed");
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Check if user has limited access (unverified email)
      if (data.limitedToken) {
        toast.success("Account created! Please check your email to verify your account and unlock full access.");
      } else {
        toast.success("Account created successfully! You can now sign in.");
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);
      console.error("Registration error:", error);
    },
  });

  // Logout function
  const logout = async () => {
    await apiClient.logout();

    // Clear all cached data
    queryClient.clear();

    // Remove profile from cache
    queryClient.removeQueries({ queryKey: queryKeys.auth.profile });
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiClient.updateProfile(userData);
      if (!response.success) {
        throw new Error(response.error?.message || "Profile update failed");
      }
      return response.data!;
    },
    onSuccess: (updatedUser: User) => {
      // Update the profile cache
      queryClient.setQueryData(queryKeys.auth.profile, updatedUser);
    },
    onError: (error) => {
      console.error("Profile update error:", error);
    },
  });

  const verifyEmail = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.verifyEmail(token);
      if (!response.success) {
        throw new Error(response.error?.message || "Email verification failed");
      }
      return response.data!;
    },
    onSuccess: (data: CookieAuthResponse) => {
      // With cookie-based auth, just update the user profile
      queryClient.setQueryData(queryKeys.auth.profile, data.user);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    },
    onError: (error) => {
      console.error("Email verification error:", error);
    },
  });

  return {
    // State
    user,
    isAuthenticated: !!user, // With cookies, just check if user exists
    isLoading,
    isError,
    error: error ? handleQueryError(error) : null,

    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    updateProfile: updateProfileMutation.mutate,
    verifyEmail: verifyEmail.mutate,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isVerifyingEmail: verifyEmail.isPending,

    loginError: loginMutation.error ? handleQueryError(loginMutation.error) : null,
    registerError: registerMutation.error ? handleQueryError(registerMutation.error) : null,
    updateError: updateProfileMutation.error ? handleQueryError(updateProfileMutation.error) : null,
    verifyEmailError: verifyEmail.error ? handleQueryError(verifyEmail.error) : null,
  };
}
