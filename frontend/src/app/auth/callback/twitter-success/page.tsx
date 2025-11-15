"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function TwitterCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    console.log("Twitter callback - Session:", session, "Status:", status);

    // Check if we have any session (Twitter auth creates a session)
    if (session && session.user) {
      // Success - notify parent window and close
      if (window.opener) {
        window.opener.postMessage({ type: "TWITTER_AUTH_SUCCESS", session }, window.location.origin);
      }

      // Auto-close after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      // No session found - this might be an error
      if (window.opener) {
        window.opener.postMessage({ type: "TWITTER_AUTH_ERROR", error: "No Twitter session found" }, window.location.origin);
      }

      // Auto-close after showing error
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [session, status]);

  const handleCloseWindow = () => {
    if (window.opener) {
      window.opener.postMessage({ type: "TWITTER_AUTH_CANCELLED" }, window.location.origin);
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <Card className="glass-card border-white/20 max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === "loading" ? (
            <div>
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-white mb-2">Processing Twitter Authentication...</h2>
              <p className="text-gray-400">Please wait while we complete your Twitter connection.</p>
            </div>
          ) : session && session.user ? (
            <div>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Twitter Connected Successfully!</h2>
              <p className="text-gray-400 mb-4">Your Twitter account has been connected. This window will close automatically.</p>
              <p className="text-sm text-gray-500">
                Connected as: <span className="text-white">{session.user?.name}</span>
              </p>
            </div>
          ) : (
            <div>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Twitter Connection Failed</h2>
              <p className="text-gray-400 mb-4">There was an issue connecting your Twitter account. Please try again.</p>
              <button onClick={handleCloseWindow} className="text-blue-400 hover:text-blue-300 underline">
                Close this window
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
