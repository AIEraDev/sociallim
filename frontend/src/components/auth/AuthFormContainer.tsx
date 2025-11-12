"use client";

import { useState } from "react";

import { BrandingInfo } from "./BrandingInfo";
import { AuthForm } from "./AuthForm";

/* Auth Form Container */
export default function AuthFormContainer() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
      {/* Left Side - Branding & Info */}
      <BrandingInfo isLogin={isLogin} />

      {/* Right Side - Auth Form */}
      <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
    </div>
  );
}
