/**
 * Post Card Component
 * Interactive post cards with platform-specific styling and hover effects
 */

import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, Play, Image as ImageIcon, MessageCircle, CheckCircle2, Circle, BarChart3 } from "lucide-react";
import { Post, Platform } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onToggleSelect: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

// Platform-specific styling and icons
const platformConfig = {
  [Platform.YOUTUBE]: {
    color: "bg-red-500",
    lightColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300",
    icon: Play,
    label: "YouTube",
  },
  [Platform.INSTAGRAM]: {
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    lightColor: "bg-purple-50 dark:bg-purple-950",
    borderColor: "border-purple-200 dark:border-purple-800",
    textColor: "text-purple-700 dark:text-purple-300",
    icon: ImageIcon,
    label: "Instagram",
  },
  [Platform.TWITTER]: {
    color: "bg-blue-500",
    lightColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: MessageCircle,
    label: "Twitter/X",
  },
  [Platform.TIKTOK]: {
    color: "bg-black dark:bg-white",
    lightColor: "bg-gray-50 dark:bg-gray-950",
    borderColor: "border-gray-200 dark:border-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    icon: Play,
    label: "TikTok",
  },
};

export function PostCard({ post, viewMode, isSelected, onToggleSelect, onAnalyze, isAnalyzing }: PostCardProps) {
  const config = platformConfig[post.platform];
  const PlatformIcon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const cardContent = (
    <>
      <CardHeader className={cn("pb-3", viewMode === "list" && "pb-2")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-md", config.lightColor)}>
                <PlatformIcon className={cn("h-4 w-4", config.textColor)} />
              </div>
              <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
            </div>
            <CardTitle className={cn("text-base leading-tight", viewMode === "list" && "text-sm")}>{post.title}</CardTitle>
          </div>

          <CardAction>
            <Button variant="ghost" size="icon-sm" onClick={onToggleSelect} className={cn("transition-colors", isSelected && "text-primary")}>
              {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", viewMode === "list" && "py-0")}>
        <div className={cn("space-y-3", viewMode === "list" && "flex items-center justify-between space-y-0")}>
          <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", viewMode === "list" && "gap-6")}>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>

            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <ExternalLink className="h-3 w-3" />
              <span>View Post</span>
            </a>
          </div>

          <div className={cn("flex gap-2", viewMode === "list" && "shrink-0")}>
            <Button size="sm" onClick={onAnalyze} disabled={isAnalyzing} className="flex-1">
              <BarChart3 className="h-3 w-3 mr-1" />
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
      <Card className={cn("cursor-pointer transition-all duration-200 hover:shadow-md", isSelected && cn("ring-2 ring-primary ring-offset-2", config.borderColor), viewMode === "list" && "hover:bg-muted/50")} onClick={onToggleSelect}>
        {cardContent}
      </Card>
    </motion.div>
  );
}
