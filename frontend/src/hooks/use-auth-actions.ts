/**
 * Authentication actions hook
 * Provides login/register actions without fetching profile
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { handleQueryError, queryKeys } from "@/lib/query-client";
import { LoginRequest, RegisterRequest, CookieAuthResponse, User } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Hook for authentication actions only (no profile fetching)
 */
export function useAuthActions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      console.log("LOGIN DATA:", credentials);
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

  //   Update profile mutation
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

  // Logout function
  const logout = async () => {
    await apiClient.logout();

    // Clear all cached data
    queryClient.clear();

    // Remove profile from cache
    queryClient.removeQueries({ queryKey: queryKeys.auth.profile });

    //
    toast.success("Logged out successfully!");
    router.replace("/auth?screen=sign-in");
  };

  return {
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

    loginError: loginMutation.error,
    registerError: registerMutation.error,
    updateError: updateProfileMutation.error ? handleQueryError(updateProfileMutation.error) : null,
    verifyEmailError: verifyEmail.error ? handleQueryError(verifyEmail.error) : null,
  };
}
