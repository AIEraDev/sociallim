"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, ExternalLink, Loader2, AlertCircle, Facebook, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TikTokIcon } from "../Icons";
import { usePlatforms } from "@/hooks/use-platforms";
import { useSocialAuth } from "@/hooks/use-social-auth";
import { Platform } from "@/types";
import { LoadingSingleCard } from "../ui/loading";
import { toast } from "sonner";

interface ConnectSocialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (platform: string) => void;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
  connected: boolean;
  comingSoon?: boolean;
}

const socialPlatforms: SocialPlatform[] = [
  // {
  //   id: "youtube",
  //   name: "YouTube",
  //   icon: Youtube,
  //   color: "text-red-400",
  //   bgColor: "bg-red-500/10 border-red-500/20",
  //   description: "Analyze comments from your YouTube videos and live streams",
  //   features: ["Video comments", "Live chat", "Community posts", "Shorts comments"],
  //   connected: false,
  // },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    description: "Analyze comments and engagement on your TikTok content",
    features: ["Video comments", "Live comments", "Duet responses", "Trend analysis"],
    connected: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
    description: "Monitor engagement on posts, stories, and reels",
    features: ["Post comments", "Story replies", "Reel comments", "DM insights"],
    connected: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    description: "Analyze engagement on Facebook posts and pages",
    features: ["Page posts", "Post comments", "Page insights", "Reactions"],
    connected: false,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: X,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    description: "Track mentions, replies, and engagement across tweets",
    features: ["Tweet replies", "Mentions", "Quote tweets", "Thread analysis"],
    connected: false,
  },
];

export function ConnectSocialModal({ open, onOpenChange }: ConnectSocialModalProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const { isConnecting, isLoading, connectedPlatforms: connectedPlatformsData, refetch } = usePlatforms();
  const { isBackendAuthenticated } = useSocialAuth();

  useEffect(() => {
    refetch();
    if (!isLoading && connectedPlatformsData.length) {
      connectedPlatformsData.forEach((platform) => {
        setConnectedPlatforms((prev) => new Set([...prev, platform.platform]));
      });
    }
  }, [connectedPlatformsData, isLoading, refetch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Connect Social Platforms</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your social media accounts to start analyzing comments and engagement.
            {!isBackendAuthenticated && <span className="block mt-2 text-amber-400 text-sm">⚠️ Please log in to your EchoMind account first to connect social platforms.</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-3 mt-6">
            {isLoading ? (
              <>
                <LoadingSingleCard className="h-70" />
                <LoadingSingleCard className="h-70" />
                <LoadingSingleCard className="h-70" />
                <LoadingSingleCard className="h-70" />
              </>
            ) : (
              socialPlatforms.map((platform) => <PlatformConnectItem key={platform.id} platform={platform} isConnected={connectedPlatforms.has(platform.id.toUpperCase())} isConnecting={isConnecting} refetchPlatforms={refetch} />)
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-sm text-gray-400">
              Need help?{" "}
              <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300">
                View setup guide
              </Button>
            </div>

            {!isBackendAuthenticated && <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">🔒 Login required to connect social accounts</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

interface PlatformConnectItem {
  platform: SocialPlatform;
  isConnected: boolean;
  isConnecting: boolean;
  refetchPlatforms: () => void;
}

function PlatformConnectItem({ platform, isConnected, isConnecting, refetchPlatforms }: PlatformConnectItem) {
  const { disconnectPlatform, connectPlatform, isLoading: loadingConnectedPlatforms } = usePlatforms();
  const { connectFacebook, connectTwitter, disconnectAccount, isConnected: isAuthConnected, canConnectSocial, isBackendAuthenticated, socialSession } = useSocialAuth();

  // Handle social media connections using NextAuth
  const handleConnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    // STRICT REQUIREMENT: User must be authenticated with your backend
    if (!isBackendAuthenticated) {
      toast.error("You must be logged in to your EchoMind account before connecting social media platforms. Please log in first.");
      return;
    }

    switch (platformId) {
      case "facebook":
      case "instagram": // Instagram uses Facebook auth
        await connectFacebook();
        break;
      case "twitter":
        const status = await connectTwitter();
        console.log("Twitter connection status:", status);

        // For Twitter, the connection happens in a new tab
        // We'll listen for the success message and then sync with backend
        if (status) {
          // Set up listener for Twitter auth completion
          setupTwitterAuthListener();
        }
        break;
      default:
        // For other platforms, use the existing API
        connectPlatform(platformId as Platform);
        break;
    }
  };

  /**
   * Set up listener for Twitter authentication completion
   */
  const setupTwitterAuthListener = () => {
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "TWITTER_AUTH_SUCCESS") {
        window.removeEventListener("message", messageListener);
        toast.success("Twitter authentication completed!");

        // Wait a moment for the session to update, then sync with backend
        setTimeout(async () => {
          await syncTwitterWithBackend();
        }, 2000);
      } else if (event.data.type === "TWITTER_AUTH_ERROR") {
        window.removeEventListener("message", messageListener);
        toast.error("Twitter authentication failed");
      } else if (event.data.type === "TWITTER_AUTH_CANCELLED") {
        window.removeEventListener("message", messageListener);
        toast.info("Twitter authentication was cancelled");
      }
    };

    window.addEventListener("message", messageListener);

    // Clean up listener after 10 minutes
    setTimeout(() => {
      window.removeEventListener("message", messageListener);
    }, 600000);
  };

  /**
   * Sync Twitter connection with backend after NextAuth success
   */
  const syncTwitterWithBackend = async () => {
    try {
      if (!socialSession || socialSession.provider !== "twitter") {
        toast.error("No Twitter session found");
        return;
      }

      console.log(socialSession);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/twitter/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for backend auth
        body: JSON.stringify({
          accessToken: socialSession.accessToken,
          refreshToken: socialSession.refreshToken,
          providerAccountId: socialSession.providerAccountId,
          userProfile: socialSession.user,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Twitter account synced with backend successfully!");
        console.log("Twitter sync result:", result);

        // Refresh the connected platforms list
        refetchPlatforms();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to sync Twitter with backend:", errorData);
        toast.error("Failed to sync Twitter account with backend");
      }
    } catch (error) {
      console.error("Error syncing Twitter with backend:", error);
      toast.error("Network error while syncing Twitter account");
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    // For social auth platforms, use NextAuth disconnect
    if (["facebook", "instagram", "twitter"].includes(platformId)) {
      await disconnectAccount();
    } else {
      // For other platforms, use the existing API
      disconnectPlatform(platformId as Platform);
    }
  };

  const Icon = platform.icon;

  return (
    <Card className={`glass-card border-white/20 ${isConnected ? "border-green-500/30 bg-green-500/5" : ""} transition-all duration-200 hover:border-white/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${platform.bgColor}`}>
              <Icon className={`w-6 h-6 ${platform.color}`} />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{platform.name}</CardTitle>
              {platform.comingSoon && (
                <Badge variant="outline" className="text-xs mt-1 border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
          {isConnected && <CheckCircle className="w-5 h-5 text-green-400" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm">{platform.description}</p>
        <div className="space-y-2">
          <h4 className="text-white font-medium text-sm">Features:</h4>
          <div className="grid grid-cols-2 gap-1">
            {platform.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-white/10" />

        {!isBackendAuthenticated && !isConnected && <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20">Please log in to your EchoMind account to connect {platform.name}</div>}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button size="sm" variant="outline" className="flex-1 border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20" disabled={loadingConnectedPlatforms}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDisconnect(platform.id)} className="text-gray-400 hover:text-white hover:bg-white/10" disabled={loadingConnectedPlatforms}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" className={`flex-1 ${platform.comingSoon ? "bg-gray-600 hover:bg-gray-600 cursor-not-allowed" : !isBackendAuthenticated ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`} onClick={() => handleConnect(platform.id)} disabled={loadingConnectedPlatforms || isConnecting || platform.comingSoon}>
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : platform.comingSoon ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Coming Soon
                </>
              ) : !isBackendAuthenticated ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Login Required
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
