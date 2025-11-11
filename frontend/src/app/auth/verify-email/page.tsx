"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { isVerifyingEmail, verifyEmail, verifyEmailError, user } = useAuth();
  const [hasTriedVerification, setHasTriedVerification] = useState(false);

  // Determine the current status based on auth hook state
  const getStatus = useCallback(() => {
    if (!token) return "error";
    if (isVerifyingEmail) return "loading";
    if (verifyEmailError) {
      // verifyEmailError is a string from handleQueryError
      return verifyEmailError.includes("expired") ? "expired" : "error";
    }
    if (user && hasTriedVerification) return "success";
    return "loading";
  }, [token, isVerifyingEmail, verifyEmailError, user, hasTriedVerification]);

  const getMessage = () => {
    const status = getStatus();
    switch (status) {
      case "loading":
        return "Verifying your email address...";
      case "success":
        return "Email verified successfully! You are now logged in.";
      case "expired":
        return "Your verification link has expired. Request a new one below.";
      case "error":
        return !token ? "Invalid verification link. Please check your email for the correct link." : "Something went wrong during verification. Please try again.";
      default:
        return "Verifying your email address...";
    }
  };

  // Trigger verification when component mounts with a token
  useEffect(() => {
    if (token && !hasTriedVerification) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setHasTriedVerification(true);
        verifyEmail(token);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [token, verifyEmail, hasTriedVerification]);

  // Handle successful verification
  useEffect(() => {
    if (getStatus() === "success") {
      toast.success("Email verified successfully!");

      // Redirect to dashboard after 3 seconds
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [getStatus, router]);

  // Handle verification errors
  useEffect(() => {
    if (verifyEmailError) {
      // verifyEmailError is already a string from handleQueryError
      toast.error(verifyEmailError || "Email verification failed");
    }
  }, [verifyEmailError]);

  const resendVerification = async () => {
    if (!user?.email) {
      toast.error("Unable to resend verification email");
      return;
    }

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const getIcon = () => {
    const status = getStatus();
    switch (status) {
      case "loading":
        return <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />;
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-400" />;
      case "error":
      case "expired":
        return <XCircle className="h-16 w-16 text-red-400" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getTitle = () => {
    const status = getStatus();
    switch (status) {
      case "loading":
        return "Verifying Email...";
      case "success":
        return "Email Verified!";
      case "expired":
        return "Link Expired";
      case "error":
        return "Verification Failed";
      default:
        return "Email Verification";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <Card className="glass-card border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-4">
              {getIcon()}
            </motion.div>

            <CardTitle className="text-2xl font-bold text-white">{getTitle()}</CardTitle>

            <CardDescription className="text-gray-300">{getMessage()}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {getStatus() === "success" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 text-sm">Welcome to EchoMind! You&apos;ll be redirected to your dashboard shortly.</p>
                </div>

                <Button onClick={() => router.push("/dashboard")} className="w-full btn-gradient-primary">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {(getStatus() === "error" || getStatus() === "expired") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{getStatus() === "expired" ? "Your verification link has expired. Request a new one below." : "Something went wrong during verification. Please try again."}</p>
                </div>

                <div className="space-y-3">
                  <Button onClick={resendVerification} className="w-full btn-gradient-primary" disabled={!user?.email}>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>

                  <Button onClick={() => router.push("/auth")} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Back to Login
                  </Button>
                </div>
              </motion.div>
            )}

            {getStatus() === "loading" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-purple-400 text-sm">Please wait while we verify your email address...</p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
