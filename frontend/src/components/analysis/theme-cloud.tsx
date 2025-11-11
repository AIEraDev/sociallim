/**
 * Theme Cloud Component
 *
 * Interactive visualization of comment themes with hover interactions,
 * sentiment-based coloring, and expandable example comments
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Theme, Sentiment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThemeCloudProps {
  themes: Theme[];
  className?: string;
}

// Sentiment colors and icons
const SENTIMENT_STYLES = {
  [Sentiment.POSITIVE]: {
    color: "hsl(var(--chart-1))",
    bgColor: "hsl(var(--chart-1) / 0.1)",
    borderColor: "hsl(var(--chart-1) / 0.3)",
    icon: TrendingUp,
  },
  [Sentiment.NEGATIVE]: {
    color: "hsl(var(--chart-4))",
    bgColor: "hsl(var(--chart-4) / 0.1)",
    borderColor: "hsl(var(--chart-4) / 0.3)",
    icon: TrendingDown,
  },
  [Sentiment.NEUTRAL]: {
    color: "hsl(var(--chart-3))",
    bgColor: "hsl(var(--chart-3) / 0.1)",
    borderColor: "hsl(var(--chart-3) / 0.3)",
    icon: Minus,
  },
};

export function ThemeCloud({ themes, className }: ThemeCloudProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  if (!themes || themes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground", className)}>
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No themes found</p>
        </div>
      </div>
    );
  }

  // Calculate size based on frequency (normalized between min and max sizes)
  const maxFrequency = Math.max(...themes.map((t) => t.frequency));
  const minFrequency = Math.min(...themes.map((t) => t.frequency));
  const frequencyRange = maxFrequency - minFrequency || 1;

  const getThemeSize = (frequency: number) => {
    const normalized = (frequency - minFrequency) / frequencyRange;
    const minSize = 0.8;
    const maxSize = 2;
    return minSize + normalized * (maxSize - minSize);
  };

  const toggleTheme = (themeId: string) => {
    setExpandedTheme(expandedTheme === themeId ? null : themeId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Theme Cloud */}
      <div className="flex flex-wrap gap-3 justify-center min-h-[200px] items-center p-4">
        {themes.map((theme, index) => {
          const style = SENTIMENT_STYLES[theme.sentiment];
          const Icon = style.icon;
          const scale = getThemeSize(theme.frequency);
          const isHovered = hoveredTheme === theme.id;
          const isExpanded = expandedTheme === theme.id;

          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isHovered ? scale * 1.1 : scale,
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              whileHover={{ scale: scale * 1.1 }}
              onHoverStart={() => setHoveredTheme(theme.id)}
              onHoverEnd={() => setHoveredTheme(null)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("relative transition-all duration-200 cursor-pointer", "hover:shadow-lg", isExpanded && "ring-2 ring-primary")}
                    style={{
                      backgroundColor: style.bgColor,
                      borderColor: style.borderColor,
                      color: style.color,
                      fontSize: `${0.75 + (scale - 0.8) * 0.5}rem`,
                      padding: `${0.5 + (scale - 0.8) * 0.25}rem ${0.75 + (scale - 0.8) * 0.5}rem`,
                    }}
                    onClick={() => toggleTheme(theme.id)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {theme.name}
                    <span className="ml-2 text-xs opacity-70">{theme.frequency}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme.frequency} mentions • {theme.sentiment.toLowerCase()} sentiment
                    </p>
                    <p className="text-xs mt-1">Click to see examples</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Theme Details */}
      <AnimatePresence>
        {expandedTheme && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            {(() => {
              const theme = themes.find((t) => t.id === expandedTheme);
              if (!theme) return null;

              const style = SENTIMENT_STYLES[theme.sentiment];
              const Icon = style.icon;

              return (
                <Card className="border-2" style={{ borderColor: style.borderColor }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: style.bgColor }}>
                          <Icon className="h-5 w-5" style={{ color: style.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{theme.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {theme.frequency} mentions • {theme.sentiment.toLowerCase()} sentiment
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setExpandedTheme(null)}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Example Comments:</h4>
                      {theme.exampleComments.slice(0, 3).map((comment, index) => (
                        <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: index * 0.1 }} className="bg-muted/50 rounded-lg p-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <p className="leading-relaxed">{comment}</p>
                          </div>
                        </motion.div>
                      ))}
                      {theme.exampleComments.length > 3 && <p className="text-xs text-muted-foreground text-center">And {theme.exampleComments.length - 3} more similar comments...</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        {Object.entries(SENTIMENT_STYLES).map(([sentiment, style]) => {
          const Icon = style.icon;
          return (
            <div key={sentiment} className="flex items-center gap-1">
              <Icon className="h-3 w-3" style={{ color: style.color }} />
              <span className="capitalize">{sentiment.toLowerCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
