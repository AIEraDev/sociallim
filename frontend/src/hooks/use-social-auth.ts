import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";
import crypto from "crypto";

import { useAuth } from "./use-auth";
import { openAuthPopup } from "@/helpers/openAuthPopup";

/**
 * Social Media Authorization Hook (Post-Login Only)
 *
 * This hook manages social media OAuth tokens for API access ONLY.
 * It is NOT used for user authentication - that's handled by your backend.
 *
 * REQUIREMENTS:
 * - User MUST be logged in through your backend authentication first
 * - Only then can they connect social media accounts for analytics
 *
 * PURPOSE:
 * - Obtain OAuth tokens for Facebook/Twitter/Instagram APIs
 * - Enable social media content analysis features
 * - Provide secure access to social platform data
 */
export function useSocialAuth() {
  const { data: session, status } = useSession();
  const { isAuthenticated, user } = useAuth(); // Your existing backend auth

  const connectFacebook = async () => {
    // STRICT REQUIREMENT: User must be authenticated with your backend
    if (!isAuthenticated) {
      toast.error("You must be logged in to connect social media accounts. Please log in first.");
      return false;
    }

    try {
      const result = await signIn("facebook", {
        redirect: false,
        callbackUrl: window.location.href, // Stay on current page
      });

      if (result?.error) {
        toast.error("Failed to connect Facebook account");
        return false;
      }

      // If successful, the session will be updated automatically
      if (result?.ok) {
        toast.success("Facebook account connected successfully!");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Facebook connection error:", error);
      toast.error("Failed to connect Facebook account");
      return false;
    }
  };

  const connectTwitter = async () => {
    if (!isAuthenticated) {
      toast.error("Log in to your EchoMind account first.");
      return false;
    }

    // Use your existing success page
    const callback = `${window.location.origin}/auth/callback/twitter-success`;
    const authUrl = `/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(callback)}`;

    try {
      const payload = await openAuthPopup(authUrl);

      if (payload.type === "TWITTER_AUTH_SUCCESS") {
        toast.success("Twitter authentication completed!");

        // // IMPORTANT: inform your backend to link the provider to the logged-in user.
        // // Either call your backend with the NextAuth session (cookie) to attach, OR
        // // call an endpoint that can read the NextAuth session and move tokens into your DB.
        // await fetch("/api/link-social/twitter", { method: "POST" });

        console.log("TWITTER STATE: SUCCESS");

        return true;
      }

      if (payload.type === "TWITTER_AUTH_ERROR") {
        toast.error("Twitter authentication failed.");
        return false;
      }

      if (payload.type === "TWITTER_AUTH_CANCELLED") {
        toast.info("Twitter authentication cancelled.");
        return false;
      }

      return false;
    } catch (err) {
      console.error("Twitter popup error:", err);
      // toast.error(err.message || "Twitter authentication failed.");
      return false;
    }
  };

  const disconnectAccount = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Social account disconnected successfully!");
      return true;
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect account");
      return false;
    }
  };

  const isConnected = (provider: string) => {
    return session?.provider === provider;
  };

  const getSocialAccessToken = () => {
    return session?.accessToken;
  };

  /**
   * Set up listener for Twitter connection success
   * Call this after initiating Twitter connection
   */
  const listenForTwitterConnection = (callback?: (success: boolean) => void) => {
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "TWITTER_AUTH_SUCCESS") {
        window.removeEventListener("message", messageListener);
        toast.success("Twitter authentication completed!");
        callback?.(true);
      } else if (event.data.type === "TWITTER_AUTH_ERROR") {
        window.removeEventListener("message", messageListener);
        toast.error("Twitter authentication failed");
        callback?.(false);
      } else if (event.data.type === "TWITTER_AUTH_CANCELLED") {
        window.removeEventListener("message", messageListener);
        toast.info("Twitter authentication was cancelled");
        callback?.(false);
      }
    };

    window.addEventListener("message", messageListener);

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      window.removeEventListener("message", messageListener);
    }, 600000);

    return () => window.removeEventListener("message", messageListener);
  };

  return {
    // Social media session (separate from your backend auth)
    socialSession: session,
    socialStatus: status,

    // Your backend authentication status
    isBackendAuthenticated: isAuthenticated,
    backendUser: user,

    // Social connection methods
    connectFacebook,
    connectTwitter,
    disconnectAccount,
    isConnected,
    getSocialAccessToken,
    listenForTwitterConnection,

    // Combined loading state
    isLoading: status === "loading",

    // Helper to check if user can connect social accounts
    canConnectSocial: isAuthenticated,
  };
}
