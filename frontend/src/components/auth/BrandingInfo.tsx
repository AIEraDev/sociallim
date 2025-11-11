import Link from "next/link";

import { motion } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";

interface BrandingInfoProps {
  isLogin: boolean;
}

export function BrandingInfo({ isLogin }: BrandingInfoProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="hidden lg:block space-y-8">
      <div className="space-y-6">
        <Link href="/" className="inline-flex items-center space-x-2 text-white hover:text-purple-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">EchoMind</h1>
            <p className="text-gray-400">AI-Powered Sentiment Analysis</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white leading-tight">{isLogin ? "Welcome Back!" : "Join EchoMind"}</h2>
        <p className="text-xl text-gray-300 leading-relaxed">{isLogin ? "Continue your journey in understanding audience sentiment across all social platforms." : "Start analyzing your audience sentiment with AI-powered insights across all major social platforms."}</p>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        {[
          { icon: "🧠", text: "AI-powered sentiment analysis" },
          { icon: "📊", text: "Real-time analytics dashboard" },
          { icon: "🌐", text: "Multi-platform support" },
          { icon: "⚡", text: "Lightning-fast processing" },
        ].map((feature, index) => (
          <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }} className="flex items-center space-x-3 text-gray-300">
            <span className="text-2xl">{feature.icon}</span>
            <span>{feature.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">2.5M+</div>
          <div className="text-sm text-gray-400">Comments Analyzed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">95%</div>
          <div className="text-sm text-gray-400">Accuracy Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">10K+</div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>
      </div>
    </motion.div>
  );
}
