"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Youtube, Instagram, CheckCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TikTokIcon } from "../Icons";

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

export function ConnectSocialModal({ open, onOpenChange, onConnect }: ConnectSocialModalProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());

  const handleConnect = async (platformId: string) => {
    if (socialPlatforms.find((p) => p.id === platformId)?.comingSoon) return;

    setConnectingPlatform(platformId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setConnectedPlatforms((prev) => new Set([...prev, platformId]));
    setConnectingPlatform(null);

    onConnect?.(platformId);
  };

  const handleDisconnect = (platformId: string) => {
    setConnectedPlatforms((prev) => {
      const newSet = new Set(prev);
      newSet.delete(platformId);
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Connect Social Platforms</DialogTitle>
          <p className="text-gray-400">Connect your social media accounts to start analyzing comments and engagement</p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            const isConnected = connectedPlatforms.has(platform.id);
            const isConnecting = connectingPlatform === platform.id;

            return (
              <motion.div key={platform.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                          <Button size="sm" variant="outline" className="flex-1 border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Connected
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDisconnect(platform.id)} className="text-gray-400 hover:text-white hover:bg-white/10">
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className={`flex-1 ${platform.comingSoon ? "bg-gray-600 hover:bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`} onClick={() => handleConnect(platform.id)} disabled={isConnecting || platform.comingSoon}>
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
              </motion.div>
            );
          })}
        </div>

        {/* Connected Platforms Summary */}
        {connectedPlatforms.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-green-400 font-medium">Successfully Connected</h3>
            </div>
            <p className="text-gray-300 text-sm">
              You&apos;ve connected {connectedPlatforms.size} platform{connectedPlatforms.size > 1 ? "s" : ""}. You can now start analyzing comments and engagement data.
            </p>
          </motion.div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Need help?{" "}
            <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300">
              View setup guide
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              {connectedPlatforms.size > 0 ? "Done" : "Cancel"}
            </Button>
            {connectedPlatforms.size > 0 && (
              <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700">
                Start Analyzing
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
