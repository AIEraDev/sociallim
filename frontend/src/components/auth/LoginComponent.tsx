import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginFormData } from "./AuthForm";
import { UseFormReturn } from "react-hook-form";

interface LoginComponentType {
  loginForm: UseFormReturn<LoginFormData>;
  onLoginSubmit: (data: LoginFormData) => void;
  isLoggingIn: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export default function LoginComponent({ loginForm, onLoginSubmit, isLoggingIn, showPassword, setShowPassword }: LoginComponentType) {
  return (
    <motion.form key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="login-email" className="flex items-center gap-2 text-white">
          <Mail className="h-4 w-4" />
          Email Address
        </Label>
        <Input id="login-email" type="email" placeholder="Enter your email" {...loginForm.register("email")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400" disabled={isLoggingIn} />
        {loginForm.formState.errors.email && <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="login-password" className="flex items-center gap-2 text-white">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <div className="relative">
          <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" {...loginForm.register("password")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10" disabled={isLoggingIn} />
          <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white" onClick={() => setShowPassword(!showPassword)} disabled={isLoggingIn}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {loginForm.formState.errors.password && <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="remember" className="rounded border-white/20" />
          <label htmlFor="remember" className="text-sm text-gray-300">
            Remember me
          </label>
        </div>
        <a href="#" className="text-sm text-purple-400 hover:text-purple-300">
          Forgot password?
        </a>
      </div>

      <Button type="submit" className="w-full btn-gradient-primary" disabled={isLoggingIn}>
        {isLoggingIn ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </motion.form>
  );
}
