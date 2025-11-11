/**
 * Keyword Cloud Component
 *
 * Interactive word cloud visualization with frequency-based sizing,
 * sentiment coloring, and context tooltips
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Hash, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";

import { Keyword, Sentiment } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KeywordCloudProps {
  keywords: Keyword[];
  className?: string;
}

// Sentiment colors
const SENTIMENT_COLORS = {
  [Sentiment.POSITIVE]: "hsl(var(--chart-1))",
  [Sentiment.NEGATIVE]: "hsl(var(--chart-4))",
  [Sentiment.NEUTRAL]: "hsl(var(--chart-3))",
};

const SENTIMENT_ICONS = {
  [Sentiment.POSITIVE]: TrendingUp,
  [Sentiment.NEGATIVE]: TrendingDown,
  [Sentiment.NEUTRAL]: Minus,
};

export function KeywordCloud({ keywords, className }: KeywordCloudProps) {
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);

  // Prepare keywords with calculated sizes and positions
  const processedKeywords = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];

    // Calculate size based on frequency
    const maxFrequency = Math.max(...keywords.map((k) => k.frequency));
    const minFrequency = Math.min(...keywords.map((k) => k.frequency));
    const frequencyRange = maxFrequency - minFrequency || 1;

    return keywords.map((keyword) => {
      const normalized = (keyword.frequency - minFrequency) / frequencyRange;
      const minSize = 0.75;
      const maxSize = 2.5;
      const size = minSize + normalized * (maxSize - minSize);

      return {
        ...keyword,
        size,
        color: SENTIMENT_COLORS[keyword.sentiment],
        icon: SENTIMENT_ICONS[keyword.sentiment],
      };
    });
  }, [keywords]);

  if (!keywords || keywords.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground", className)}>
        <div className="text-center">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No keywords found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Keyword Cloud */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[200px] items-center p-4">
        {processedKeywords.map((keyword, index) => {
          const Icon = keyword.icon;
          const isHovered = hoveredKeyword === keyword.id;

          return (
            <motion.div
              key={keyword.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isHovered ? keyword.size * 1.1 : keyword.size,
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.02,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              whileHover={{ scale: keyword.size * 1.1 }}
              onHoverStart={() => setHoveredKeyword(keyword.id)}
              onHoverEnd={() => setHoveredKeyword(null)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full", "cursor-pointer transition-all duration-200", "hover:shadow-md border border-transparent", isHovered && "border-current")}
                    style={{
                      color: keyword.color,
                      backgroundColor: `${keyword.color}15`,
                      fontSize: `${0.7 + (keyword.size - 0.75) * 0.3}rem`,
                      fontWeight: 400 + Math.round((keyword.size - 0.75) * 200),
                    }}
                  >
                    <Hash className="h-3 w-3 opacity-60" />
                    {keyword.word}
                    <span className="text-xs opacity-70 ml-1">{keyword.frequency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: keyword.color }} />
                      <span className="font-medium">{keyword.word}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Frequency: {keyword.frequency} mentions</p>
                      <p>Sentiment: {keyword.sentiment.toLowerCase()}</p>
                    </div>
                    {keyword.contexts.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1">Example contexts:</p>
                        <div className="space-y-1">
                          {keyword.contexts.slice(0, 2).map((context, idx) => (
                            <p key={idx} className="italic text-muted-foreground">
                              &ldquo;{context.length > 60 ? context.substring(0, 60) + "&hellip;" : context}&rdquo;
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>

      {/* Keyword Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-muted-foreground">Total Keywords</p>
          <p className="text-lg font-bold">{keywords.length}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-muted-foreground">Most Frequent</p>
          <p className="text-lg font-bold">{processedKeywords[0]?.word || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{processedKeywords[0]?.frequency || 0} mentions</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-muted-foreground">Positive Keywords</p>
          <p className="text-lg font-bold" style={{ color: SENTIMENT_COLORS[Sentiment.POSITIVE] }}>
            {keywords.filter((k) => k.sentiment === Sentiment.POSITIVE).length}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-muted-foreground">Negative Keywords</p>
          <p className="text-lg font-bold" style={{ color: SENTIMENT_COLORS[Sentiment.NEGATIVE] }}>
            {keywords.filter((k) => k.sentiment === Sentiment.NEGATIVE).length}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        {Object.entries(SENTIMENT_COLORS).map(([sentiment, color]) => {
          const Icon = SENTIMENT_ICONS[sentiment as Sentiment];
          return (
            <div key={sentiment} className="flex items-center gap-1">
              <Icon className="h-3 w-3" style={{ color }} />
              <span className="capitalize">{sentiment.toLowerCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
