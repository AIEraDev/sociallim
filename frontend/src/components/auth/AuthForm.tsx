import { AnimatePresence, motion } from "framer-motion";
import { Brain } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPasswordStrength } from "@/helpers/utils";
import { loginSchema, registerSchema } from "@/schema/auth-schema";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { toast } from "sonner";
import RegisterComponent from "./RegisterComponent";
import LoginComponent from "./LoginComponent";

export type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Extended type for honeypot fields (bot protection)
export type RegisterFormWithHoneypot = RegisterFormData & {
  website?: string;
  company?: string;
  homepage?: string;
  agreeToTerms?: boolean;
};

interface AuthFormProps {
  isLogin: boolean;
  setIsLogin: (login: boolean) => void;
}

export function AuthForm({ isLogin, setIsLogin }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const param = searchParams.get("screen") ?? "sign-in";
  const [completedRegister, setCompletedRegister] = useState(false);

  const { isLoggingIn, login: loginUser, register: registerUser, isRegistering } = useAuthActions();

  //
  useEffect(() => {
    setIsLogin(param === "sign-in" ? true : false);
  }, [setIsLogin, param]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // Register form fields
  const registerForm = useForm<RegisterFormWithHoneypot>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  // React Compiler safe password tracking
  const [password, setPassword] = useState("");
  const passwordStrength = getPasswordStrength(password);

  // Handle password input changes directly
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Login Submit Handler
  const onLoginSubmit = async (data: LoginFormData) => {
    loginUser(data, {
      onSuccess: () => {
        // Handle successful login
        router.push("/dashboard");
      },
    }); // Let the mutation handle success/error toasts
  };

  // Register Submit Handler
  const onRegisterSubmit = async (data: RegisterFormWithHoneypot) => {
    // Extract honeypot fields, terms agreement, and main registration data
    const { confirmPassword, website, company, homepage, agreeToTerms, ...registerData } = data;

    if (confirmPassword) {
    }

    // Log honeypot values for debugging (should be empty for humans)
    if (website || company || homepage) {
      console.warn("Honeypot fields filled - potential bot detected:", { website, company, homepage });
    }

    // Ensure terms are agreed to (additional client-side check)
    if (!agreeToTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    registerUser(registerData, {
      onSuccess: () => {
        setCompletedRegister(true);
      },
    }); // Let the mutation handle success/error toasts
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="w-full max-w-md mx-auto lg:mx-0">
      {completedRegister ? (
        <Card className="glass-card border-white/20 shadow-2xl">
          <CardContent className="text-center py-12 px-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }} className="w-20 h-20 bg-linear-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <h1 className="text-3xl font-bold text-white mb-4">Registration Complete!</h1>
              <p className="text-gray-300 text-lg mb-6">We&apos;ve sent a verification link to your email address.</p>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Check your inbox</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Didn&apos;t receive the email? Check your spam folder or <button className="text-blue-400 hover:text-blue-300 underline">resend verification</button>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">EchoMind</span>
            </div>

            <div className="flex items-center justify-center gap-x-4 space-x-1 mb-6">
              <Button variant={isLogin ? "default" : "ghost"} onClick={() => setIsLogin(true)} className={`px-6 py-2 rounded-full transition-all ${isLogin ? "btn-gradient-primary" : "text-white bg-white/10"}`}>
                Sign In
              </Button>
              <Button variant={!isLogin ? "default" : "ghost"} onClick={() => setIsLogin(false)} className={`px-6 py-2 rounded-full transition-all ${!isLogin ? "btn-gradient-primary" : "text-white bg-white/10"}`}>
                Sign Up
              </Button>
            </div>

            <CardTitle className="text-2xl font-bold text-white">{isLogin ? "Sign in to your account" : "Create your account"}</CardTitle>
            <CardDescription className="text-gray-300">{isLogin ? "Enter your credentials to access your dashboard" : "Join thousands of creators analyzing their audience sentiment"}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">{isLogin ? <LoginComponent loginForm={loginForm} onLoginSubmit={onLoginSubmit} isLoggingIn={isLoggingIn} showPassword={showPassword} setShowPassword={setShowPassword} /> : <RegisterComponent registerForm={registerForm} onRegisterSubmit={onRegisterSubmit} isRegistering={isRegistering} showPassword={showPassword} handlePasswordChange={handlePasswordChange} setShowPassword={setShowPassword} passwordStrength={passwordStrength} password={password} setShowConfirmPassword={setShowConfirmPassword} showConfirmPassword={showConfirmPassword} />}</AnimatePresence>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
