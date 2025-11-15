"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-gradient-primary">Sociallim</span>
        </div>

        <Card className="glass-card border-white/20 shadow-2xl">
          <CardContent className="p-12">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-gradient-primary mb-4 animate-pulse">404</div>
              <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
              <p className="text-gray-300 text-lg mb-2">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
              <p className="text-gray-400 text-sm">It might have been moved, deleted, or you entered the wrong URL.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/">
                <Button className="btn-gradient-primary w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>

              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-4">Looking for something specific?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/auth">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/auth?screen=sign-up">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                <Search className="w-4 h-4" />
                <span className="font-medium text-sm">Need Help?</span>
              </div>
              <p className="text-xs text-gray-400">If you believe this is an error, please contact our support team or try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">© 2024 Sociallim. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
