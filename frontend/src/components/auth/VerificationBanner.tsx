"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface VerificationBannerProps {
  user: {
    email: string;
    emailVerified: boolean;
    tokenType?: string;
  };
  onDismiss?: () => void;
}

export function VerificationBanner({ user, onDismiss }: VerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if email is already verified or banner is dismissed
  if (user.emailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);

    try {
      const response = await apiClient.resendEmailVerification(user.email);

      if (response.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(response.error?.message || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }} className="bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-amber-100">Email Verification Required</h3>
              {user.tokenType === "limited" && <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-full">Limited Access</span>}
            </div>

            <p className="text-sm text-amber-200/80 mb-3">
              Please verify your email address <strong>{user.email}</strong> to access all features. Check your inbox for the verification link.
            </p>

            <div className="flex items-center gap-3">
              <Button onClick={handleResendVerification} disabled={isResending} size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50">
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Email
                  </>
                )}
              </Button>

              <span className="text-xs text-amber-300/60">Didn&apos;t receive it? Check your spam folder.</span>
            </div>
          </div>

          <Button onClick={handleDismiss} size="sm" variant="ghost" className="shrink-0 h-6 w-6 p-0 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Success banner shown after email verification
 */
export function VerificationSuccessBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }} className="bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-green-100 mb-1">Email Verified Successfully!</h3>
            <p className="text-sm text-green-200/80">Your account is now fully activated. You have access to all features.</p>
          </div>

          <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost" className="shrink-0 h-6 w-6 p-0 text-green-400/60 hover:text-green-400 hover:bg-green-500/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
