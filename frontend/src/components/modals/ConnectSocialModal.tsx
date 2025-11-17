"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TikTokIcon } from "../Icons";
import { usePlatforms } from "@/hooks/use-platforms";
import { Platform } from "@/types";
import { LoadingSingleCard } from "../ui/loading";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { useMetaAuth } from "@/hooks/useMetaAuth";
import { apiClient } from "@/lib/api-client";
import { FaMeta } from "react-icons/fa6";

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
    id: "meta",
    name: "Meta",
    icon: FaMeta,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    description: "Analyze engagement on Facebook and Instagram posts",
    features: ["Facebook posts", "Instagram posts", "Page insights", "Story engagement"],
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
          <DialogDescription className="text-gray-400">Connect your social media accounts to start analyzing comments and engagement.</DialogDescription>
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

function PlatformConnectItem({ platform, isConnected, isConnecting }: PlatformConnectItem) {
  const { disconnectPlatform, connectPlatform, isLoading: loadingConnectedPlatforms } = usePlatforms();
  const { isConnectingTwitter, connectTwitter } = useTwitterAuth();
  const { isConnectingMeta, connectMeta } = useMetaAuth();

  // Handle social media connections using NextAuth
  const handleConnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    switch (platformId) {
      case "meta": // Meta handles both Facebook and Instagram
        connectMeta();
        break;
      case "twitter":
        connectTwitter();
        break;
      default:
        // For other platforms, use the existing API
        connectPlatform(platformId as Platform);
        break;
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    // For social auth platforms, use specific disconnect methods
    switch (platformId) {
      case "meta":
        // Use Meta disconnect API (handles both Facebook and Instagram)
        await apiClient.disconnectMeta();
        break;
      case "twitter":
        // Use Twitter disconnect API
        await apiClient.disconnectTwitter();
        break;
      default:
        // For other platforms, use the existing API
        disconnectPlatform(platformId as Platform);
        break;
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
      <CardContent className="space-y-4 flex-1 flex flex-col">
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

        <div className="flex gap-2 mt-auto border-t border-t-white/10 pt-4">
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
              {isConnecting || isConnectingTwitter || isConnectingMeta ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
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
