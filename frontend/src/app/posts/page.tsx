/**
 * Posts Page - Modern post selection and analysis interface
 * Integrates post selection, filtering, and real-time analysis progress
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Filter, BarChart3 } from "lucide-react";
import { Platform, Post } from "@/types";
import { usePlatforms } from "@/hooks/use-platforms";
import { PostSelection } from "@/components/posts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";

const platformOptions = [
  { value: undefined, label: "All Platforms", icon: BarChart3 },
  { value: Platform.YOUTUBE, label: "YouTube", icon: BarChart3 },
  { value: Platform.INSTAGRAM, label: "Instagram", icon: BarChart3 },
  { value: Platform.TWITTER, label: "Twitter/X", icon: BarChart3 },
  { value: Platform.TIKTOK, label: "TikTok", icon: BarChart3 },
];

export default function PostsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | undefined>();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { connectedPlatforms, isLoading: platformsLoading } = usePlatforms();

  // Show loading while platforms are being fetched
  if (platformsLoading) {
    return <LoadingPage message="Loading your connected platforms..." />;
  }

  // Show message if no platforms are connected
  if (connectedPlatforms.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Connect Your Platforms</h1>
            <p className="text-muted-foreground">To analyze your posts, you need to connect at least one social media platform.</p>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analyze Your Posts</h1>
              <p className="text-muted-foreground">Select posts to analyze comment sentiment and discover audience insights</p>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/analysis/demo">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Demo
            </Link>
          </Button>
        </div>

        {/* Platform filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((option) => {
                const isConnected = option.value ? connectedPlatforms.some((cp) => cp.platform === option.value) : true;

                if (!isConnected && option.value) return null;

                return (
                  <Button key={option.label} variant={selectedPlatform === option.value ? "default" : "outline"} size="sm" onClick={() => setSelectedPlatform(option.value)} disabled={!isConnected} className="flex items-center gap-2">
                    <option.icon className="h-3 w-3" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Post Selection Interface */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PostSelection selectedPlatform={selectedPlatform} onPostSelect={setSelectedPost} />
      </motion.div>

      {/* Selected post info */}
      {selectedPost && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 max-w-sm">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Analysis started for:</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedPost.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
