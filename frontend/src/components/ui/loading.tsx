/**
 * Loading components for various UI states
 * Provides consistent loading indicators across the application
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Animated loading spinner component
 */
export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />;
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

/**
 * Skeleton loading component for content placeholders
 */
export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  const widths = React.useMemo(() => Array.from({ length: lines }, (_, i) => `${60 + ((i * 13) % 40)}%`), [lines]);

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted animate-pulse rounded"
          style={{
            width: widths[i],
          }}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
}

/**
 * Card skeleton for loading states
 */
export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-20" />
      </div>
      <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-muted animate-pulse rounded w-24" />
        <div className="h-8 bg-muted animate-pulse rounded w-20" />
      </div>
    </div>
  );
}

/**
 * Post card skeleton specifically for post loading
 */
export function PostCardSkeleton({ className }: LoadingCardProps) {
  return (
    <div className={cn("p-4 border rounded-lg space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted animate-pulse rounded" />
          <div className="h-3 bg-muted animate-pulse rounded w-16" />
        </div>
        <div className="w-5 h-5 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="h-5 bg-muted animate-pulse rounded w-4/5" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-3 bg-muted animate-pulse rounded w-20" />
          <div className="h-3 bg-muted animate-pulse rounded w-16" />
        </div>
        <div className="h-8 bg-muted animate-pulse rounded w-20" />
      </div>
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
}

/**
 * Full page loading component
 */
export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
