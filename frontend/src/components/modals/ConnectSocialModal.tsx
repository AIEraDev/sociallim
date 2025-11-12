"use client";

import { useEffect, useState } from "react";
import { X, Youtube, Instagram, CheckCircle, ExternalLink, Loader2, AlertCircle, Facebook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TikTokIcon } from "../Icons";
import { usePlatforms } from "@/hooks/use-platforms";
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
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    description: "Analyze comments from your YouTube videos and live streams",
    features: ["Video comments", "Live chat", "Community posts", "Shorts comments"],
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
];

export function ConnectSocialModal({ open, onOpenChange }: ConnectSocialModalProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const { isConnecting, isLoading, connectedPlatforms: connectedPlatformsData, refetch } = usePlatforms();

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
          <DialogDescription className="text-gray-400">Connect your social media accounts to start analyzing comments and engagement</DialogDescription>
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
              socialPlatforms.map((platform) => <PlatformConnectItem key={platform.id} platform={platform} isConnected={connectedPlatforms.has(platform.id.toUpperCase())} isConnecting={isConnecting} />)
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlatformConnectItem({ platform, isConnected, isConnecting }: { platform: SocialPlatform; isConnected: boolean; isConnecting: boolean }) {
  const { disconnectPlatform, connectPlatform, isLoading: loadingConnectedPlatforms } = usePlatforms();

  // Handle Facebook token after SDK login
  const handleFacebookToken = async (accessToken: string, userID: string) => {
    try {
      // Send Facebook token to your backend to complete OAuth flow
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/oauth/facebook/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          accessToken,
          userID,
        }),
      });

      if (response.ok) {
        // Successfully connected Facebook
        window.location.reload(); // Refresh to update connection status
      } else {
        console.error("Failed to connect Facebook account");
      }
    } catch (error) {
      console.error("Error connecting Facebook:", error);
    }
  };

  // Check if Facebook SDK is ready
  const isFacebookSDKReady = () => {
    return typeof window !== "undefined" && window.FB && window.FB.init;
  };

  // Wait for Facebook SDK to be ready
  const waitForFacebookSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isFacebookSDKReady()) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const checkInterval = setInterval(() => {
        attempts++;
        if (isFacebookSDKReady()) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error("Facebook SDK failed to load"));
        }
      }, 100);
    });
  };

  const handleConnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    if (platformId === "facebook") {
      // Check if we're on HTTPS (required for Facebook login)
      if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        console.error("Facebook login requires HTTPS");
        toast.error("Facebook login requires a secure connection (HTTPS). Please use HTTPS or localhost for development.");
        return;
      }

      try {
        // Wait for Facebook SDK to be ready
        await waitForFacebookSDK();

        // Use proper typing for Facebook response
        window.FB.login(
          function (response: { status: "connected" | "not_authorized" | "unknown"; authResponse?: { accessToken: string; userID: string; expiresIn: number; signedRequest: string } }) {
            if (response.authResponse) {
              // User logged in successfully
              const accessToken = response.authResponse.accessToken;
              const userID = response.authResponse.userID;

              console.log(accessToken);
              console.log(userID);

              // Send token to your backend
              handleFacebookToken(accessToken, userID);
            } else {
              console.error("Facebook login failed:", response);
              if (response.status === "not_authorized") {
                alert("Please authorize the app to connect your Facebook account.");
              } else if (response.status === "unknown") {
                alert("Facebook login failed. Please try again.");
              }
            }
          },
          { scope: "public_profile,email,pages_read_engagement,pages_show_list" }
        );
      } catch (error) {
        console.error("Facebook SDK not available:", error);
        alert("Facebook SDK is not available. Please refresh the page and try again.");
      }

      return;
    }

    // Simulate API call
    connectPlatform(platformId as Platform);
  };

  const handleDisconnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;
    // Simulate API call
    disconnectPlatform(platformId as Platform);
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
            <Button size="sm" className={`flex-1 ${platform.comingSoon ? "bg-gray-600 hover:bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`} onClick={() => handleConnect(platform.id)} disabled={loadingConnectedPlatforms || isConnecting || platform.comingSoon}>
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
