/**
 * Beautiful platform connection card with interactive states and animations
 * Displays connection status and provides OAuth connection functionality
 */

"use client";

import { motion } from "framer-motion";
import { Youtube, Instagram, Twitter, Music, CheckCircle, AlertCircle, Loader2, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform } from "@/types";
import { usePlatforms } from "@/hooks/use-platforms";

interface PlatformCardProps {
  platform: Platform;
  className?: string;
}

// Platform configuration
const platformConfig = {
  [Platform.YOUTUBE]: {
    name: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    description: "Connect your YouTube channel to analyze video comments and engagement patterns.",
    features: ["Video comments", "Engagement metrics", "Audience insights"],
  },
  [Platform.INSTAGRAM]: {
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
    description: "Analyze Instagram post comments and stories to understand your audience better.",
    features: ["Post comments", "Story reactions", "Follower insights"],
  },
  [Platform.TWITTER]: {
    name: "Twitter/X",
    icon: Twitter,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Monitor tweet replies and mentions to track conversations about your content.",
    features: ["Tweet replies", "Mentions", "Trending topics"],
  },
  [Platform.TIKTOK]: {
    name: "TikTok",
    icon: Music,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    description: "Understand TikTok video comments and discover what resonates with your audience.",
    features: ["Video comments", "Viral trends", "Creator insights"],
  },
};

export function PlatformCard({ platform, className }: PlatformCardProps) {
  const { connectPlatform, disconnectPlatform, isPlatformConnected, getPlatformStatus, isConnecting, isDisconnecting, connectError, disconnectError } = usePlatforms();

  const config = platformConfig[platform];
  const Icon = config.icon;
  const isConnected = isPlatformConnected(platform);
  const status = getPlatformStatus(platform);
  const isLoading = isConnecting || isDisconnecting;

  const handleConnect = async () => {
    try {
      await connectPlatform(platform);
      toast.success(`Connecting to ${config.name}...`);
    } catch (error) {
      console.log(error);
      toast.error(connectError || `Failed to connect to ${config.name}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPlatform(platform);
      toast.success(`Disconnected from ${config.name}`);
    } catch (error) {
      console.log(error);
      toast.error(disconnectError || `Failed to disconnect from ${config.name}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }} className={className}>
      <Card className={`h-full transition-all duration-300 hover:shadow-lg ${isConnected ? `${config.bgColor} ${config.borderColor}` : "hover:border-primary/20"}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status Indicator */}
            <motion.div
              animate={{
                scale: isConnected ? [1, 1.2, 1] : 1,
                opacity: isConnected ? [1, 0.7, 1] : 0.5,
              }}
              transition={{
                duration: 2,
                repeat: isConnected ? Infinity : 0,
                ease: "easeInOut",
              }}
              className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-muted-foreground"}`}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed">{config.description}</CardDescription>

          {/* Features List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Features:</h4>
            <ul className="space-y-1">
              {config.features.map((feature, index) => (
                <motion.li key={feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connection Details */}
          {isConnected && status.connectedAt && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-medium">{formatDate(status.connectedAt)}</span>
              </div>
              {status.platformUserId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{status.platformUserId}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isLoading} className="w-full">
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={isLoading} className="w-full" size="sm">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Connect {config.name}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Error Display */}
          {(connectError || disconnectError) && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-xs text-destructive">{connectError || disconnectError}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
