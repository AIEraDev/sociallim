"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Home, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
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
              <h1 className="text-3xl font-bold text-white mb-4">Something went wrong!</h1>
              <p className="text-gray-300 text-lg mb-2">We encountered an unexpected error while processing your request.</p>
              <p className="text-gray-400 text-sm">Don&apos;t worry, our team has been notified and we&apos;re working to fix this issue.</p>
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
                Try Again
              </Button>

              <Link href="/">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-4">What you can do:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white/5 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Refresh</p>
                  <p className="text-gray-400 text-xs">Try reloading the page</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Home className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Go Home</p>
                  <p className="text-gray-400 text-xs">Return to homepage</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Report</p>
                  <p className="text-gray-400 text-xs">Contact support</p>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-300 font-medium text-sm mb-1">Need immediate help?</p>
              <p className="text-xs text-gray-400">Contact our support team if this error persists or if you need urgent assistance.</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">© 2024 EchoMind. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
