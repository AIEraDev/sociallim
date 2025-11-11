/**
 * Emotion Indicators Component
 *
 * Beautiful emotion analysis visualization with progress rings,
 * animated indicators, and detailed emotion breakdowns
 */

import React from "react";
import { motion } from "framer-motion";
import { Heart, Smile, Frown, Angry, Zap, AlertTriangle, Meh, Sparkles } from "lucide-react";

import { Emotion } from "@/types";
import { cn } from "@/lib/utils";

interface EmotionIndicatorsProps {
  emotions: Emotion[];
  className?: string;
}

// Emotion icon and color mapping
const EMOTION_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  joy: {
    icon: Smile,
    color: "hsl(var(--chart-1))",
    bgColor: "hsl(var(--chart-1) / 0.1)",
    description: "Happiness and delight",
  },
  happiness: {
    icon: Smile,
    color: "hsl(var(--chart-1))",
    bgColor: "hsl(var(--chart-1) / 0.1)",
    description: "General positive feelings",
  },
  love: {
    icon: Heart,
    color: "hsl(var(--chart-5))",
    bgColor: "hsl(var(--chart-5) / 0.1)",
    description: "Affection and appreciation",
  },
  anger: {
    icon: Angry,
    color: "hsl(var(--chart-4))",
    bgColor: "hsl(var(--chart-4) / 0.1)",
    description: "Frustration and irritation",
  },
  sadness: {
    icon: Frown,
    color: "hsl(var(--chart-3))",
    bgColor: "hsl(var(--chart-3) / 0.1)",
    description: "Disappointment and sorrow",
  },
  fear: {
    icon: AlertTriangle,
    color: "hsl(var(--chart-2))",
    bgColor: "hsl(var(--chart-2) / 0.1)",
    description: "Anxiety and concern",
  },
  surprise: {
    icon: Zap,
    color: "hsl(var(--chart-1))",
    bgColor: "hsl(var(--chart-1) / 0.1)",
    description: "Amazement and wonder",
  },
  neutral: {
    icon: Meh,
    color: "hsl(var(--muted-foreground))",
    bgColor: "hsl(var(--muted) / 0.5)",
    description: "Balanced emotional state",
  },
};

// Progress ring component
function ProgressRing({ percentage, size = 80, strokeWidth = 6, color }: { percentage: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-muted-foreground/20" />
        {/* Progress circle */}
        <motion.circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={strokeDasharray} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1, ease: "easeInOut" }} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function EmotionIndicators({ emotions, className }: EmotionIndicatorsProps) {
  if (!emotions || emotions.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground", className)}>
        <div className="text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No emotions detected</p>
        </div>
      </div>
    );
  }

  // Sort emotions by percentage (descending)
  const sortedEmotions = [...emotions].sort((a, b) => b.percentage - a.percentage);

  // Get top 3 emotions for detailed view
  const topEmotions = sortedEmotions.slice(0, 3);
  const otherEmotions = sortedEmotions.slice(3);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Emotions with Progress Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topEmotions.map((emotion, index) => {
          const config = EMOTION_CONFIG[emotion.name.toLowerCase()] || EMOTION_CONFIG.neutral;
          const Icon = config.icon;

          return (
            <motion.div key={emotion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center space-y-3">
              <div className="flex justify-center">
                <ProgressRing percentage={emotion.percentage} color={config.color} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-2 rounded-full" style={{ backgroundColor: config.bgColor }}>
                    <div style={{ color: config.color }}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-semibold capitalize">{emotion.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Other Emotions (if any) */}
      {otherEmotions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Other Emotions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {otherEmotions.map((emotion, index) => {
              const config = EMOTION_CONFIG[emotion.name.toLowerCase()] || EMOTION_CONFIG.neutral;
              const Icon = config.icon;

              return (
                <motion.div key={emotion.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: config.bgColor }}>
                    <div style={{ color: config.color }}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize truncate">{emotion.name}</p>
                    <p className="text-xs text-muted-foreground">{emotion.percentage.toFixed(1)}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emotion Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Emotion Summary</h4>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Dominant Emotion</p>
            <p className="font-medium capitalize">{sortedEmotions[0]?.name || "None"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Emotional Diversity</p>
            <p className="font-medium">
              {emotions.length} emotion{emotions.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>

        {/* Emotional tone description */}
        <div className="mt-3 pt-3 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            {(() => {
              const topEmotion = sortedEmotions[0];
              if (!topEmotion) return "No clear emotional pattern detected.";

              const percentage = topEmotion.percentage;
              if (percentage > 50) {
                return `Strong ${topEmotion.name.toLowerCase()} sentiment dominates the comments.`;
              } else if (percentage > 30) {
                return `Moderate ${topEmotion.name.toLowerCase()} sentiment with mixed emotions.`;
              } else {
                return "Balanced emotional distribution across comments.";
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
