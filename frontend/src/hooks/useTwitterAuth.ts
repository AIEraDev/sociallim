import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { usePlatforms } from "./use-platforms";

export function useTwitterAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting] = useState(false);
  const { refetch } = usePlatforms();

  // Mutation for completing Twitter auth
  const completeTwitterAuthMutation = useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => {
      return apiClient.completeTwitterAuth(code, state);
    },
    onSuccess: (data) => {
      console.log("Twitter auth completed successfully:", data);
      toast.success("Twitter connected successfully!");
    },
    onError: (error: unknown) => {
      console.error("Twitter auth completion failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete Twitter authentication";
      toast.error(errorMessage);
    },
  });

  /**
   * Initiate Twitter OAuth flow
   */
  const connectTwitter = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Get authorization URL from backend
      const data = await apiClient.getTwitterAuthUrl();
      const { authUrl, state } = data;

      console.log("Twitter Auth URL:", authUrl);

      // Store state for validation
      sessionStorage.setItem("twitter_oauth_state", state);

      // Open Twitter OAuth in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(authUrl, "Twitter OAuth", `width=${width},height=${height},left=${left},top=${top}`);

      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site.");
        return false;
      }

      // Listen for callback messages from popup
      return new Promise<boolean>((resolve) => {
        const messageHandler = async (event: MessageEvent) => {
          // Only accept messages from same origin
          if (event.origin !== window.location.origin) return;

          console.log("Received message from popup:", event.data);

          if (event.data.type === "TWITTER_AUTH_SUCCESS") {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);

            // Don't close popup here - let the callback page handle it
            console.log("Twitter auth success received in parent");
            toast.success("Twitter connected successfully!");
            refetch();
            resolve(true);
          } else if (event.data.type === "TWITTER_AUTH_ERROR") {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);

            // Don't close popup here - let the callback page handle it
            console.log("Twitter auth error received in parent:", event.data.error);
            toast.error(event.data.error || "Twitter authentication failed");
            resolve(false);
          }
        };

        window.addEventListener("message", messageHandler);

        // Check if popup was closed manually (before auth completes)
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);
            console.log("Popup was closed manually");
            toast.info("Twitter authentication cancelled");
            resolve(false);
          }
        }, 1000);
      });
    } catch (error) {
      console.error("Twitter connection error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect Twitter";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refetch]);

  /**
   * Complete Twitter authentication (called from callback page)
   * This is the function you'll call from your callback page
   */
  const completeTwitterAuth = useCallback(
    async (code: string, state: string) => {
      try {
        const result = await completeTwitterAuthMutation.mutateAsync({ code, state });
        return result;
      } catch (error) {
        throw error;
      }
    },
    [completeTwitterAuthMutation]
  );

  return {
    connectTwitter,
    completeTwitterAuth,
    isConnectingTwitter: isConnecting,
    isDisconnecting,
    isCompleting: completeTwitterAuthMutation.isPending,
  };
}
