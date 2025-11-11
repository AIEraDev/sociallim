"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Settings, CheckCircle2, XCircle, AlertCircle, Youtube, Instagram, Twitter, Linkedin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/dashboard/topbar";
import AppLayout from "@/components/AppLayout";

const mockPlatforms = [
  {
    id: 1,
    name: "YouTube",
    icon: Youtube,
    status: "connected" as const,
    posts: 23,
    comments: 12470,
    lastSync: "2 hours ago",
    account: "@yourchannel",
  },
  {
    id: 2,
    name: "Instagram",
    icon: Instagram,
    status: "connected" as const,
    posts: 45,
    comments: 8560,
    lastSync: "5 hours ago",
    account: "@yourhandle",
  },
  {
    id: 3,
    name: "Twitter",
    icon: Twitter,
    status: "connected" as const,
    posts: 12,
    comments: 4320,
    lastSync: "1 day ago",
    account: "@yourusername",
  },
  {
    id: 4,
    name: "LinkedIn",
    icon: Linkedin,
    status: "disconnected" as const,
    posts: 0,
    comments: 0,
    lastSync: "Never",
    account: null,
  },
  {
    id: 5,
    name: "TikTok",
    icon: MessageSquare,
    status: "pending" as const,
    posts: 0,
    comments: 0,
    lastSync: "Never",
    account: null,
  },
];

export default function PlatformsPage() {
  const [platforms] = useState(mockPlatforms);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-(--vr-success)/20 text-(--vr-success)">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge className="bg-(--vr-danger)/20 text-(--vr-danger)">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-(--vr-accent-1)/20 text-(--vr-accent-1)">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="transition-all duration-300">
        <Topbar />

        <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Platforms</h1>
              <p className="text-(--vr-muted)">Manage your social media platform connections</p>
            </div>
            <Button className="btn-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Connect Platform
            </Button>
          </div>

          {/* Platform Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <motion.div key={platform.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                  <Card className="glass-card border-border card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-gradient-primary/10">
                            <Icon className="w-6 h-6 text-(--vr-accent-1)" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground">{platform.name}</CardTitle>
                            {platform.account && <CardDescription className="text-(--vr-muted)">{platform.account}</CardDescription>}
                          </div>
                        </div>
                        {getStatusBadge(platform.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-(--vr-muted) mb-1">Posts</div>
                          <div className="text-xl font-bold text-foreground">{platform.posts}</div>
                        </div>
                        <div>
                          <div className="text-sm text-(--vr-muted) mb-1">Comments</div>
                          <div className="text-xl font-bold text-foreground">{platform.comments.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-sm text-(--vr-muted) mb-4">Last sync: {platform.lastSync}</div>
                      <div className="flex gap-2">
                        {platform.status === "connected" ? (
                          <>
                            <Button variant="outline" className="flex-1 border-border bg-secondary">
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </Button>
                            <Button variant="outline" className="border-border bg-secondary text-(--vr-danger) hover:bg-(--vr-danger)/10">
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button className="flex-1 btn-gradient-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Available Platforms */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Available Platforms</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["Facebook", "Reddit", "Discord", "Telegram"].map((name, i) => (
                <Card key={i} className="glass-card border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium text-foreground">{name}</span>
                    <Button size="sm" variant="outline" className="border-border bg-secondary">
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
