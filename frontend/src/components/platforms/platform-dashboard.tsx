/**
 * Interactive platform connection dashboard with real-time updates
 * Displays all available platforms and their connection status
 */

"use client";

import { motion } from "framer-motion";
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform } from "@/types";
import { usePlatforms } from "@/hooks/use-platforms";
import { PlatformCard } from "./platform-card";

export function PlatformDashboard() {
  const { connectedPlatforms, isLoading, error, refetch } = usePlatforms();

  const allPlatforms = Object.values(Platform);
  const connectedCount = connectedPlatforms.length;
  const totalPlatforms = allPlatforms.length;

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Connections</h2>
          <p className="text-muted-foreground">Connect your social media accounts to start analyzing comments</p>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="w-fit">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Status Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectedCount > 0 ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
              Connection Status
            </CardTitle>
            <CardDescription>
              {connectedCount} of {totalPlatforms} platforms connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="flex-1 bg-muted rounded-full h-2">
                <motion.div className="bg-primary rounded-full h-2" initial={{ width: 0 }} animate={{ width: `${(connectedCount / totalPlatforms) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>

              {/* Status Text */}
              <div className="text-sm font-medium">
                {connectedCount}/{totalPlatforms}
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-4">
              {connectedCount === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  No platforms connected. Connect at least one platform to start analyzing.
                </div>
              )}
              {connectedCount > 0 && connectedCount < totalPlatforms && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Wifi className="h-4 w-4" />
                  Great! Connect more platforms for comprehensive analysis.
                </div>
              )}
              {connectedCount === totalPlatforms && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Wifi className="h-4 w-4" />
                  Excellent! All platforms connected. You&apos;re ready to analyze.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Failed to load platform connections</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Platform Cards Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {allPlatforms.map((platform, index) => (
          <motion.div key={platform} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
            <PlatformCard platform={platform} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      {connectedCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Now that you have platforms connected, here&apos;s what you can do next</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">View Posts</div>
                    <div className="text-sm text-muted-foreground">Browse your recent posts</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Start Analysis</div>
                    <div className="text-sm text-muted-foreground">Analyze comment sentiment</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">View History</div>
                    <div className="text-sm text-muted-foreground">Check past analyses</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">Loading platform connections...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
