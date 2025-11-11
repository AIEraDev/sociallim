import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormWithHoneypot } from "./AuthForm";

interface RegisterComponentType {
  registerForm: UseFormReturn<RegisterFormWithHoneypot>;
  onRegisterSubmit: (data: RegisterFormWithHoneypot) => void;
  isRegistering: boolean;
  showPassword: boolean;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowPassword: (show: boolean) => void;
  passwordStrength: { score: number; label: string; color: string };
  password: string;
  setShowConfirmPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
}

export default function RegisterComponent({ registerForm, onRegisterSubmit, isRegistering, showPassword, handlePasswordChange, setShowPassword, passwordStrength, password, setShowConfirmPassword, showConfirmPassword }: RegisterComponentType) {
  return (
    <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-white">
            First Name
          </Label>
          <Input id="firstName" placeholder="John" {...registerForm.register("firstName")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400" disabled={isRegistering} />
          {registerForm.formState.errors.firstName && <p className="text-sm text-red-400">{registerForm.formState.errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-white">
            Last Name
          </Label>
          <Input id="lastName" placeholder="Doe" {...registerForm.register("lastName")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400" disabled={isRegistering} />
          {registerForm.formState.errors.lastName && <p className="text-sm text-red-400">{registerForm.formState.errors.lastName.message}</p>}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="register-email" className="flex items-center gap-2 text-white">
          <Mail className="h-4 w-4" />
          Email Address
        </Label>
        <Input id="register-email" type="email" placeholder="Enter your email" {...registerForm.register("email")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400" disabled={isRegistering} />
        {registerForm.formState.errors.email && <p className="text-sm text-red-400">{registerForm.formState.errors.email.message}</p>}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="register-password" className="flex items-center gap-2 text-white">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            {...registerForm.register("password", {
              onChange: handlePasswordChange,
            })}
            className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10"
            disabled={isRegistering}
          />
          <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white" onClick={() => setShowPassword(!showPassword)} disabled={isRegistering}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <motion.div className={`h-full rounded-full ${passwordStrength.color}`} initial={{ width: 0 }} animate={{ width: `${(passwordStrength.score / 5) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="text-xs text-gray-300">{passwordStrength.label}</span>
            </div>

            {/* Password Requirements */}
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                {password.length >= 8 ? <Check className="h-3 w-3 text-green-400" /> : <X className="h-3 w-3 text-gray-400" />}
                <span className={password.length >= 8 ? "text-green-400" : "text-gray-400"}>8+ chars</span>
              </div>
              <div className="flex items-center gap-1">
                {/[A-Z]/.test(password) ? <Check className="h-3 w-3 text-green-400" /> : <X className="h-3 w-3 text-gray-400" />}
                <span className={/[A-Z]/.test(password) ? "text-green-400" : "text-gray-400"}>Uppercase</span>
              </div>
              <div className="flex items-center gap-1">
                {/[a-z]/.test(password) ? <Check className="h-3 w-3 text-green-400" /> : <X className="h-3 w-3 text-gray-400" />}
                <span className={/[a-z]/.test(password) ? "text-green-400" : "text-gray-400"}>Lowercase</span>
              </div>
              <div className="flex items-center gap-1">
                {/[0-9]/.test(password) ? <Check className="h-3 w-3 text-green-400" /> : <X className="h-3 w-3 text-gray-400" />}
                <span className={/[0-9]/.test(password) ? "text-green-400" : "text-gray-400"}>Number</span>
              </div>
            </div>
          </motion.div>
        )}

        {registerForm.formState.errors.password && <p className="text-sm text-red-400">{registerForm.formState.errors.password.message}</p>}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-white">
          <Lock className="h-4 w-4" />
          Confirm Password
        </Label>
        <div className="relative">
          <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" {...registerForm.register("confirmPassword")} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10" disabled={isRegistering} />
          <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isRegistering}>
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {registerForm.formState.errors.confirmPassword && <p className="text-sm text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>}
      </div>

      {/* Honeypot fields - hidden from users but visible to bots */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <input type="text" placeholder="Your website" {...registerForm.register("website")} tabIndex={-1} autoComplete="off" />
        <input type="text" placeholder="Company name" {...registerForm.register("company")} tabIndex={-1} autoComplete="off" />
        <input type="url" placeholder="Homepage URL" {...registerForm.register("homepage")} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <input type="checkbox" id="terms" {...registerForm.register("agreeToTerms")} className="mt-1 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-400 focus:ring-offset-0" />
          <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
              Privacy Policy
            </a>
          </label>
        </div>
        {registerForm.formState.errors.agreeToTerms && <p className="text-sm text-red-400 ml-7">{registerForm.formState.errors.agreeToTerms.message}</p>}
      </div>

      <Button type="submit" className="w-full btn-gradient-primary" disabled={isRegistering || !registerForm.formState.isValid}>
        {isRegistering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </motion.form>
  );
}
