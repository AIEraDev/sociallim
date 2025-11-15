"use client";

import { useEffect, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

type AuthStatus = "loading" | "success" | "error";

export default function TwitterCallbackPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      // Use getSession() to actively fetch the session, bypassing potential
      // race conditions with the useSession() hook on initial load.
      const session = await getSession();

      if (session?.user) {
        setAuthStatus("success");
        setUserName(session.user.name ?? null);
        if (window.opener) {
          window.opener.postMessage({ type: "TWITTER_AUTH_SUCCESS", session }, window.location.origin);
        }
        setTimeout(() => window.close(), 1500); // Auto-close on success
      } else {
        setAuthStatus("error");
        if (window.opener) {
          window.opener.postMessage({ type: "TWITTER_AUTH_ERROR", error: "No Twitter session found" }, window.location.origin);
        }
        setTimeout(() => window.close(), 3000); // Keep window open longer on error
      }
    };

    checkSession();
  }, []);

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
          {authStatus === "loading" && (
            <div>
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-white mb-2">Processing Twitter Authentication...</h2>
              <p className="text-gray-400">Please wait while we complete your Twitter connection.</p>
            </div>
          )}
          {authStatus === "success" && (
            <div>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Twitter Connected Successfully!</h2>
              <p className="text-gray-400 mb-4">This window will now close automatically.</p>
              {userName && (
                <p className="text-sm text-gray-500">
                  Connected as: <span className="text-white">{userName}</span>
                </p>
              )}
            </div>
          )}
          {authStatus === "error" && (
            <div>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Twitter Connection Failed</h2>
              <p className="text-gray-400 mb-4">There was an issue connecting your account. Please try again.</p>
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
