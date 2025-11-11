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
import { useAuth } from "@/hooks/use-auth";
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

  const { isLoggingIn, login: loginUser, register: registerUser, isRegistering } = useAuth();

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

            {/* Social Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                {/* prettier-ignore */}
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Google
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
                Twitter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
