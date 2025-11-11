/**
 * Sentiment Chart Component
 *
 * Interactive pie chart and bar chart for sentiment breakdown visualization
 * with smooth animations and hover interactions
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart as PieChartIcon } from "lucide-react";

import { SentimentBreakdown } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SentimentChartProps {
  breakdown: SentimentBreakdown;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Chart colors matching the theme
const SENTIMENT_COLORS = {
  positive: "hsl(var(--chart-1))", // Green
  negative: "hsl(var(--chart-4))", // Red
  neutral: "hsl(var(--chart-3))", // Gray
};

const SENTIMENT_ICONS = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

// Custom tooltip component - defined outside of render
function CustomTooltipComponent({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (active && payload && payload.length) {
    const data = (payload[0] as { payload: { name: string; value: number; percentage: number; color: string } })?.payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <p className="font-medium">{data.name}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-medium">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
}

export function SentimentChart({ breakdown, className, size = "md" }: SentimentChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Prepare data for charts
  const chartData = [
    {
      name: "Positive",
      value: breakdown.positive,
      percentage: (breakdown.positive / (breakdown.positive + breakdown.negative + breakdown.neutral)) * 100,
      color: SENTIMENT_COLORS.positive,
      icon: SENTIMENT_ICONS.positive,
    },
    {
      name: "Negative",
      value: breakdown.negative,
      percentage: (breakdown.negative / (breakdown.positive + breakdown.negative + breakdown.neutral)) * 100,
      color: SENTIMENT_COLORS.negative,
      icon: SENTIMENT_ICONS.negative,
    },
    {
      name: "Neutral",
      value: breakdown.neutral,
      percentage: (breakdown.neutral / (breakdown.positive + breakdown.negative + breakdown.neutral)) * 100,
      color: SENTIMENT_COLORS.neutral,
      icon: SENTIMENT_ICONS.neutral,
    },
  ].filter((item) => item.value > 0); // Only show non-zero values

  // Custom label for pie chart
  // const renderCustomLabel = React.useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  //   if (percent < 0.05) return null; // Don't show labels for very small slices

  //   const RADIAN = Math.PI / 180;
  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);

  //   return (
  //     <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-sm font-medium">
  //       {`${(percent * 100).toFixed(0)}%`}
  //     </text>
  //   );
  // }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Type Toggle */}
      {size !== "sm" && (
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant={chartType === "pie" ? "default" : "outline"} size="sm" onClick={() => setChartType("pie")}>
              <PieChartIcon className="h-4 w-4 mr-2" />
              Pie Chart
            </Button>
            <Button variant={chartType === "bar" ? "default" : "outline"} size="sm" onClick={() => setChartType("bar")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Bar Chart
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">Confidence: {(breakdown.confidenceScore * 100).toFixed(1)}%</div>
        </div>
      )}

      {/* Chart Container */}
      <motion.div key={chartType} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className={cn(size === "sm" ? "h-48" : size === "lg" ? "h-96" : "h-80")}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" animationBegin={0} animationDuration={800}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipComponent />} />
              <Legend verticalAlign="bottom" height={36} formatter={(value, entry: unknown) => <span style={{ color: (entry as { color?: string })?.color }}>{value}</span>} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipComponent />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </motion.div>

      {/* Sentiment Summary Cards */}
      {size !== "sm" && (
        <div className="grid grid-cols-3 gap-4">
          {chartData.map((sentiment, index) => {
            const Icon = sentiment.icon;
            return (
              <motion.div key={sentiment.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5" style={{ color: sentiment.color }} />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{sentiment.name}</p>
                <p className="text-lg font-bold">{sentiment.percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{sentiment.value} comments</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
