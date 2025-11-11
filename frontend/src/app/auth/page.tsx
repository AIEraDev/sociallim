"use client";

import { useState } from "react";
import { BrandingInfo } from "@/components/auth/BrandingInfo";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthGuard } from "@/components/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Info */}
          <BrandingInfo isLogin={isLogin} />

          {/* Right Side - Auth Form */}
          <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
        </div>
      </div>
    </AuthGuard>
  );
}
