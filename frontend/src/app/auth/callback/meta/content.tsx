"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMetaAuth } from "@/hooks/useMetaAuth";

export default function MetaCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string>("");
  const { completeMetaAuth } = useMetaAuth();
  const processingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions using ref
    if (processingRef.current) return;
    processingRef.current = true;

    const handleCallback = async () => {
      try {
        console.log("Starting Meta callback processing...");

        // Get URL parameters
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        // Handle user denial
        if (errorParam === "access_denied") {
          if (window.opener) {
            window.opener.postMessage({ type: "META_AUTH_ERROR", error: "Access denied by user" }, window.location.origin);
            window.close();
          } else {
            setStatus("error");
            setError("Access denied");
          }
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error("Missing authorization code or state");
        }

        // Validate state (CSRF protection)
        const storedState = sessionStorage.getItem("meta_oauth_state");
        if (!storedState) {
          throw new Error("No stored state found. Please try connecting again.");
        }

        if (state !== storedState) {
          throw new Error("Invalid state parameter - possible CSRF attack");
        }

        // Complete OAuth flow by calling backend
        const result = await completeMetaAuth(code, state);
        console.log("Auth completed successfully:", result);

        // Clean up
        sessionStorage.removeItem("meta_oauth_state");

        setStatus("success");

        // Check if we're in a popup
        if (window.opener) {
          console.log("Notifying parent window...");

          if (result.success) {
            // Send success message to parent
            window.opener.postMessage(
              {
                type: "META_AUTH_SUCCESS",
                data: result.data,
              },
              window.location.origin
            );
          } else {
            // Send error message to parent
            window.opener.postMessage(
              {
                type: "META_AUTH_ERROR",
                error: "Authentication failed",
              },
              window.location.origin
            );
          }

          // Close popup after a brief delay to ensure message is received
          setTimeout(() => {
            console.log("Closing popup...");
            window.close();
          }, 1000);
        } else {
          // If not in popup, redirect to dashboard
          console.log("Not in popup, redirecting...");
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } catch (err: unknown) {
        console.error("Meta callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";
        setStatus("error");
        setError(errorMessage);

        // Notify parent window of error if in popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "META_AUTH_ERROR",
              error: errorMessage,
            },
            window.location.origin
          );

          setTimeout(() => window.close(), 2000);
        }

        // Reset processing flag on error to allow retry
        processingRef.current = false;
      }
    };

    handleCallback();
  }, [searchParams, completeMetaAuth, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "processing" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting Meta...</h2>
            <p className="text-gray-600">Please wait while we complete the authentication.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">Your Meta account has been connected successfully.</p>
            <p className="text-sm text-gray-500 mt-2">This includes access to both Facebook and Instagram.</p>
            {!window.opener && <p className="text-sm text-gray-500 mt-4">Redirecting...</p>}
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {!window.opener && (
              <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Return to Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
