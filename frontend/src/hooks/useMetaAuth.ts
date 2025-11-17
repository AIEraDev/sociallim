import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { usePlatforms } from "./use-platforms";

export function useMetaAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting] = useState(false);
  const { refetch } = usePlatforms();

  // Mutation for completing Meta auth
  const completeMetaAuthMutation = useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => {
      return apiClient.completeFacebookAuth(code, state); // Still uses Facebook API internally
    },
    onSuccess: (data) => {
      console.log("Meta auth completed successfully:", data);
      toast.success("Meta connected successfully!");
    },
    onError: (error: unknown) => {
      console.error("Meta auth completion failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete Meta authentication";
      toast.error(errorMessage);
    },
  });

  /**
   * Initiate Meta OAuth flow (handles both Facebook and Instagram)
   */
  const connectMeta = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Get authorization URL from backend
      const data = await apiClient.getFacebookAuthUrl(); // Still uses Facebook API internally
      const { authUrl, state } = data;

      console.log("Meta Auth URL:", authUrl);

      // Store state for validation
      sessionStorage.setItem("meta_oauth_state", state);

      // Open Meta OAuth in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(authUrl, "Meta OAuth", `width=${width},height=${height},left=${left},top=${top}`);

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

          if (event.data.type === "META_AUTH_SUCCESS") {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);

            // Don't close popup here - let the callback page handle it
            console.log("Meta auth success received in parent");
            toast.success("Meta connected successfully!");
            refetch();
            resolve(true);
          } else if (event.data.type === "META_AUTH_ERROR") {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);

            // Don't close popup here - let the callback page handle it
            console.log("Meta auth error received in parent:", event.data.error);
            toast.error(event.data.error || "Meta authentication failed");
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
            toast.info("Meta authentication cancelled");
            resolve(false);
          }
        }, 1000);
      });
    } catch (error) {
      console.error("Meta connection error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect Meta";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refetch]);

  /**
   * Complete Meta authentication (called from callback page)
   * This is the function you'll call from your callback page
   */
  const completeMetaAuth = useCallback(
    async (code: string, state: string) => {
      try {
        const result = await completeMetaAuthMutation.mutateAsync({ code, state });
        return result;
      } catch (error) {
        throw error;
      }
    },
    [completeMetaAuthMutation]
  );

  return {
    connectMeta,
    completeMetaAuth,
    isConnectingMeta: isConnecting,
    isDisconnecting,
    isCompleting: completeMetaAuthMutation.isPending,
  };
}
