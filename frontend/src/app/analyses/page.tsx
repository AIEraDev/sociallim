"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, RefreshCw, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { PostCard } from "@/components/dashboard/post-card";

const mockAnalyses = [
  {
    id: 1,
    title: "YouTube Video: 'How to Create Amazing Content'",
    platform: "YouTube",
    comments: 1247,
    sentiment: { positive: 72, neutral: 20, negative: 8 },
    status: "completed" as const,
    date: "2 hours ago",
  },
  {
    id: 2,
    title: "Instagram Post: Behind the Scenes",
    platform: "Instagram",
    comments: 856,
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    status: "completed" as const,
    date: "5 hours ago",
  },
  {
    id: 3,
    title: "Twitter Thread: Product Launch",
    platform: "Twitter",
    comments: 432,
    sentiment: { positive: 58, neutral: 30, negative: 12 },
    status: "processing" as const,
    date: "1 day ago",
  },
  {
    id: 4,
    title: "TikTok Video: Quick Tutorial",
    platform: "TikTok",
    comments: 2341,
    sentiment: { positive: 78, neutral: 15, negative: 7 },
    status: "completed" as const,
    date: "2 days ago",
  },
  {
    id: 5,
    title: "LinkedIn Post: Industry Insights",
    platform: "LinkedIn",
    comments: 189,
    sentiment: { positive: 82, neutral: 12, negative: 6 },
    status: "completed" as const,
    date: "3 days ago",
  },
];

export default function AnalysesPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<number | null>(null);

  const handleViewDetails = (id: number) => {
    setSelectedAnalysis(id);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <LeftNav />
      <div className="transition-all duration-300">
        <Topbar />
        <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analyses</h1>
            <p className="text-[var(--vr-muted)]">View and manage all your sentiment analyses</p>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vr-muted)]" />
              <Input type="search" placeholder="Search analyses..." className="w-full pl-10 bg-background border-border" />
            </div>
            <Button variant="outline" className="border-border bg-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-border bg-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
            <Button variant="outline" className="border-border bg-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="btn-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="text-sm text-[var(--vr-muted)] mb-1">Total Analyses</div>
                <div className="text-2xl font-bold text-foreground">47</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="text-sm text-[var(--vr-muted)] mb-1">Completed</div>
                <div className="text-2xl font-bold text-[var(--vr-success)]">42</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="text-sm text-[var(--vr-muted)] mb-1">Processing</div>
                <div className="text-2xl font-bold text-[var(--vr-accent-1)]">3</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="text-sm text-[var(--vr-muted)] mb-1">Failed</div>
                <div className="text-2xl font-bold text-[var(--vr-danger)]">2</div>
              </CardContent>
            </Card>
          </div>

          {/* Analyses List */}
          <Card className="glass-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">All Analyses</CardTitle>
                  <CardDescription className="text-[var(--vr-muted)]">Your complete analysis history</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-border bg-secondary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAnalyses.map((analysis, index) => (
                <PostCard key={analysis.id} {...analysis} delay={index * 0.05} onViewDetails={handleViewDetails} onRerun={(id) => console.log("Rerun", id)} onMarkResolved={(id) => console.log("Resolved", id)} />
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
