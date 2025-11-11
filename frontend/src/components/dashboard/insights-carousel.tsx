"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, MessageSquare, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  gradient: string;
}

const insights: Insight[] = [
  {
    id: 1,
    icon: TrendingUp,
    title: "Sentiment trending positive",
    description: "Your latest content shows a 15% increase in positive sentiment compared to last week.",
    cta: "See comments",
    gradient: "from-[var(--vr-accent-1)]/20 to-[var(--vr-accent-2)]/20",
  },
  {
    id: 2,
    icon: MessageSquare,
    title: "New comment cluster detected",
    description: "127 comments discussing 'product features' with 89% positive sentiment.",
    cta: "See comments",
    gradient: "from-[var(--vr-accent-2)]/20 to-[var(--vr-accent-1)]/20",
  },
  {
    id: 3,
    icon: Users,
    title: "Engagement spike",
    description: "Your Instagram post received 3x more comments than your average.",
    cta: "See comments",
    gradient: "from-[var(--vr-success)]/20 to-[var(--vr-accent-1)]/20",
  },
  {
    id: 4,
    icon: Sparkles,
    title: "Actionable insight",
    description: "Comments suggest users want more tutorial content. Consider creating a series.",
    cta: "See comments",
    gradient: "from-[var(--vr-accent-1)]/20 to-[var(--vr-success)]/20",
  },
];

export function InsightsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentInsight = insights[currentIndex];
  const Icon = currentInsight.icon;

  return (
    <Card className="glass-card border-white/20 overflow-hidden">
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className={`p-6 bg-gradient-to-br ${currentInsight.gradient}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{currentInsight.title}</h3>
                <p className="text-sm text-[var(--vr-muted)]">{currentInsight.description}</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="w-full justify-between text-white hover:bg-white/10" onClick={() => {}}>
              <span>{currentInsight.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="flex items-center justify-center gap-1.5 p-4 border-t border-white/10">
          {insights.map((_, index) => (
            <button key={index} onClick={() => setCurrentIndex(index)} className={cn("w-1.5 h-1.5 rounded-full transition-all", index === currentIndex ? "w-6 bg-[var(--vr-accent-1)]" : "bg-white/20 hover:bg-white/40")} aria-label={`Go to insight ${index + 1}`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
