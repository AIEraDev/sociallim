"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  sparkline?: number[];
  delay?: number;
}

export function KPICard({ title, value, change, trend, icon: Icon, sparkline, delay = 0 }: KPICardProps) {
  // Generate sparkline data if not provided
  const sparklineData = sparkline || Array.from({ length: 20 }, () => Math.random() * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card className="glass-card border-white/20 card-hover overflow-hidden">
        <CardContent className="p-6 relative">
          {/* Background vignette */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--vr-accent-1)]/5 via-transparent to-transparent pointer-events-none" />

          {/* Icon */}
          <div className="relative flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg", trend === "up" && "bg-[var(--vr-success)]/20", trend === "down" && "bg-[var(--vr-danger)]/20", trend === "neutral" && "bg-[var(--vr-neutral)]/20")}>
              <Icon className={cn("w-6 h-6", trend === "up" && "text-[var(--vr-success)]", trend === "down" && "text-[var(--vr-danger)]", trend === "neutral" && "text-[var(--vr-neutral)]")} />
            </div>

            {/* Sparkline */}
            <div className="w-16 h-8 opacity-60">
              <svg viewBox="0 0 60 30" className="w-full h-full">
                <polyline points={sparklineData.map((val, i) => `${(i / (sparklineData.length - 1)) * 60},${30 - (val / 100) * 30}`).join(" ")} fill="none" stroke={trend === "up" ? "var(--vr-success)" : trend === "down" ? "var(--vr-danger)" : "var(--vr-neutral)"} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Value */}
          <div className="relative">
            <p className="text-xs sm:text-sm font-medium text-[var(--vr-muted)] mb-1">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-3">{value}</p>

            {/* Change indicator */}
            <div className="flex items-center gap-1.5">
              {trend === "up" && <TrendingUp className="w-4 h-4 text-[var(--vr-success)]" />}
              {trend === "down" && <TrendingDown className="w-4 h-4 text-[var(--vr-danger)]" />}
              <span className={cn("text-sm font-medium", trend === "up" && "text-[var(--vr-success)]", trend === "down" && "text-[var(--vr-danger)]", trend === "neutral" && "text-[var(--vr-neutral)]")}>{change}</span>
              <span className="text-sm text-[var(--vr-muted)]">from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
