"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockComments = [
  { text: "This is absolutely amazing! Love the new features.", sentiment: "positive", author: "Sarah M.", platform: "YouTube" },
  { text: "Could be better, but it's okay I guess.", sentiment: "neutral", author: "Mike R.", platform: "Instagram" },
  { text: "Great content as always! Keep it up!", sentiment: "positive", author: "Alex K.", platform: "Twitter" },
  { text: "Not really what I expected...", sentiment: "negative", author: "Emma L.", platform: "TikTok" },
];

// Mock data for demonstrations
const mockSentimentData = [
  { name: "Positive", value: 65, color: "#10B981" },
  { name: "Neutral", value: 25, color: "#6B7280" },
  { name: "Negative", value: 10, color: "#EF4444" },
];

export function HeroSection() {
  const [currentComment, setCurrentComment] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentComment((prev) => (prev + 1) % mockComments.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-linear-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Sentiment Analysis
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Know what your audience says — <span className="bg-linear-to-r from-purple-600 via-pink-600 to-cyan-600 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-transparent">in 10s</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">Transform social media comments into actionable insights instantly. Our AI analyzes sentiment across all platforms with 95% accuracy.</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth">
                <Button size="lg" className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all">
                  Analyze my comments
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 hover:bg-muted">
                <Play className="mr-2 w-5 h-5" />
                See demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-linear-to-r from-purple-400 to-pink-400 border-2 border-background flex items-center justify-center text-white text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span>Trusted by 5,342 creators</span>
            </div>
          </motion.div>

          {/* Interactive Dashboard Preview */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ y: y1 }} className="relative">
            <div className="relative glass rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Live Sentiment Analysis</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              </div>

              {/* Sentiment Chart */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {mockSentimentData.map((item, index) => (
                  <motion.div key={item.name} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + index * 0.1 }} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted" />
                        <motion.circle cx="32" cy="32" r="28" stroke={item.color} strokeWidth="4" fill="none" strokeLinecap="round" initial={{ strokeDasharray: "0 175.93" }} animate={{ strokeDasharray: `${item.value * 1.7593} 175.93` }} transition={{ duration: 1, delay: 0.8 + index * 0.1 }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">{item.value}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                  </motion.div>
                ))}
              </div>

              {/* Live Comments */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Comments</h4>
                <motion.div key={currentComment} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-muted/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-linear-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white">{mockComments[currentComment].author[0]}</div>
                      <span className="text-sm font-medium">{mockComments[currentComment].author}</span>
                      <Badge variant="secondary" className="text-xs">
                        {mockComments[currentComment].platform}
                      </Badge>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${mockComments[currentComment].sentiment === "positive" ? "bg-green-400" : mockComments[currentComment].sentiment === "negative" ? "bg-red-400" : "bg-gray-400"}`}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">{mockComments[currentComment].text}</p>
                </motion.div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 w-20 h-20 bg-linear-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl" />
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -bottom-4 -left-4 w-16 h-16 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full opacity-20 blur-xl" />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
}
