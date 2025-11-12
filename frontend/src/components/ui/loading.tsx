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
 * Post card skeleton specifically for post loading - matches PostItem layout
 */
export function PostCardSkeleton({ className }: LoadingCardProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-white/10 bg-white/5 space-y-4", className)}>
      {/* Main content area */}
      <div className="flex gap-4">
        {/* Thumbnail skeleton */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 bg-white/10 animate-pulse rounded-lg" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title skeleton - 2 lines */}
          <div className="space-y-2">
            <div className="h-4 bg-white/10 animate-pulse rounded w-full" />
            <div className="h-4 bg-white/10 animate-pulse rounded w-3/4" />
          </div>

          {/* Description skeleton - 2 lines */}
          <div className="space-y-1.5">
            <div className="h-3 bg-white/8 animate-pulse rounded w-full" />
            <div className="h-3 bg-white/8 animate-pulse rounded w-2/3" />
          </div>

          {/* Stats row skeleton */}
          <div className="flex items-center gap-4">
            {/* View count */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white/8 animate-pulse rounded" />
              <div className="h-3 bg-white/8 animate-pulse rounded w-8" />
            </div>
            {/* Like count */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white/8 animate-pulse rounded" />
              <div className="h-3 bg-white/8 animate-pulse rounded w-6" />
            </div>
            {/* Comments */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white/8 animate-pulse rounded" />
              <div className="h-3 bg-white/8 animate-pulse rounded w-12" />
            </div>
            {/* Time - right aligned */}
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-3 h-3 bg-white/8 animate-pulse rounded" />
              <div className="h-3 bg-white/8 animate-pulse rounded w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2 pt-3 border-t border-white/5">
        <div className="h-8 bg-white/8 animate-pulse rounded px-3 w-20" />
        <div className="h-8 bg-white/8 animate-pulse rounded px-3 w-24" />
        <div className="h-8 bg-white/8 animate-pulse rounded px-3 w-20 ml-auto" />
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

export function LoadingSingleCard({ className }: { className?: string }) {
  return <div className={cn("w-full h-full bg-white/8 animate-pulse rounded-lg " + className)} />;
}
