"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Home, RefreshCw, AlertTriangle } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-gradient-primary">EchoMind</span>
            </div>

            <Card className="glass-card border-red-500/20 shadow-2xl">
              <CardContent className="p-12">
                {/* Error Icon */}
                <div className="mb-8">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>
                  <div className="w-24 h-1 bg-red-500 mx-auto rounded-full"></div>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-4">Critical Error</h1>
                  <p className="text-gray-300 text-lg mb-2">A critical error occurred that prevented the application from loading properly.</p>
                  <p className="text-gray-400 text-sm">Please try refreshing the page or contact support if the problem persists.</p>
                </div>

                {/* Error Details (Development) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                    <h3 className="text-red-400 font-medium mb-2">Error Details (Development)</h3>
                    <code className="text-xs text-gray-300 break-all">{error.message}</code>
                    {error.digest && <p className="text-xs text-gray-400 mt-2">Error ID: {error.digest}</p>}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button onClick={reset} className="btn-gradient-primary w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Application
                  </Button>

                  <Button onClick={() => (window.location.href = "/")} variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Support Info */}
                <div className="mt-8 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-red-300 font-medium text-sm mb-1">Critical System Error</p>
                  <p className="text-xs text-gray-400">If this error continues to occur, please contact our technical support team immediately.</p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">© 2024 EchoMind. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
