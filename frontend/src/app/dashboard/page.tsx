"use client";

/*** Sociallim Dashboard - Comment Analysis Focused ***/

import { useState } from "react";
import { TrendingUp, TrendingDown, MessageSquare, BarChart3, AlertTriangle, Clock, Users, Target, Activity, Zap, Eye, Heart, Share2, Filter, Calendar, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AppLayout from "@/components/AppLayout";
import GlobalHeader from "@/components/GlobalHeader";
import RecentPosts from "@/components/dashboard/RecentPosts";
import { usePlatformStore } from "@/stores/platformStore";

// Mock data for comment analysis dashboard
const mockDashboardData = {
  overview: {
    totalAnalyses: { value: 47, change: +5, period: "this week" },
    commentsAnalyzed: { value: "156.2K", change: +12.8, period: "last 30 days" },
    avgSentiment: { value: 72.4, change: +2.1, period: "vs last week" },
    activeMonitoring: { value: 8, change: 0, period: "posts" },
  },
  recentAnalyses: [
    {
      id: 1,
      title: "Product Launch Video",
      platform: "meta",
      commentsAnalyzed: 1247,
      sentiment: { positive: 78, neutral: 15, negative: 7 },
      status: "completed",
      timestamp: "2 hours ago",
      insights: 5,
      alerts: 1,
    },
    {
      id: 2,
      title: "Behind the Scenes Content",
      platform: "tiktok",
      commentsAnalyzed: 856,
      sentiment: { positive: 65, neutral: 25, negative: 10 },
      status: "completed",
      timestamp: "5 hours ago",
      insights: 3,
      alerts: 0,
    },
    {
      id: 3,
      title: "Tutorial Series Ep 1",
      platform: "twitter",
      commentsAnalyzed: 432,
      sentiment: { positive: 58, neutral: 30, negative: 12 },
      status: "processing",
      timestamp: "1 day ago",
      insights: 2,
      alerts: 2,
    },
  ],
  topInsights: [
    {
      type: "trending_topic",
      title: "Users love the new feature",
      mentions: 234,
      sentiment: "positive",
      growth: "+45%",
    },
    {
      type: "concern",
      title: "Audio quality complaints",
      mentions: 89,
      sentiment: "negative",
      growth: "+12%",
    },
    {
      type: "request",
      title: "More tutorial requests",
      mentions: 156,
      sentiment: "neutral",
      growth: "+23%",
    },
  ],
  alerts: [
    {
      id: 1,
      type: "spike",
      message: "Negative sentiment spike detected",
      post: "Product Launch Video",
      severity: "high",
      timestamp: "15 min ago",
    },
    {
      id: 2,
      type: "volume",
      message: "Comment volume 3x higher than usual",
      post: "Behind the Scenes Content",
      severity: "medium",
      timestamp: "1 hour ago",
    },
  ],
};

const mockSelectedPost = {
  id: 1,
  title: "How to Create Amazing Content in 2024",
  platform: "YouTube",
  cacheStatus: "Live",
  cacheExpiry: null,
  summary: "Users are highly engaged with the content creation tips, particularly praising the practical examples and step-by-step approach. Many are requesting follow-up videos on specific topics.",
  sentiment: { positive: 72.3, neutral: 19.2, negative: 8.5 },
  confidence: 94,
  insights: [
    { title: "Audio Quality Complaints", count: 23, sample: ["Audio is a bit low", "Hard to hear in some parts", "Please fix the mic"] },
    { title: "Requests for Longer Episodes", count: 45, sample: ["Make it longer!", "Need more detail", "Could be 20 mins instead"] },
    { title: "Timestamp Requests", count: 18, sample: ["Add timestamps please", "Need chapters", "Where's the timeline?"] },
  ],
  commentClusters: [
    {
      title: "Content Quality",
      percent: 35,
      sentiment: "positive",
      samples: ["Amazing tips!", "This helped me so much", "Best tutorial ever"],
    },
    {
      title: "Technical Issues",
      percent: 15,
      sentiment: "negative",
      samples: ["Audio is low", "Video quality could be better", "Some lag issues"],
    },
    {
      title: "Feature Requests",
      percent: 25,
      sentiment: "neutral",
      samples: ["Please add timestamps", "Make it longer", "Cover more topics"],
    },
  ],
  recentComments: [
    { id: 1, author: "user123", text: "This is exactly what I needed! Thank you!", time: "2m ago", flagged: false },
    { id: 2, author: "creator_pro", text: "Great tutorial, but audio could be better", time: "5m ago", flagged: false },
    { id: 3, author: "spam_account", text: "Check out my channel for better content!!!", time: "8m ago", flagged: true },
  ],
};

const mockAnalytics = {
  commentVolume: [12, 15, 18, 22, 28, 35, 42, 38, 45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 82, 78, 85, 92, 88, 95],
  topKeywords: ["tutorial", "amazing", "helpful", "audio", "quality", "more", "please", "great", "love", "thanks"],
  moderationQueue: [
    { id: 1, comment: "Spam content here...", reason: "Spam", severity: "high" },
    { id: 2, comment: "Inappropriate language...", reason: "Language", severity: "medium" },
  ],
};

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");

  return (
    <AppLayout>
      <div className="transition-all duration-300">
        {/* Global Header / Controls */}
        <GlobalHeader />

        {/* Overview KPIs */}
        <div className="border-b border-white/10 bg-black/10">
          <div className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Analyses */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <div className="text-2xl font-bold text-white">{mockDashboardData.overview.totalAnalyses.value}</div>
                  <div className="flex items-center text-green-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    {mockDashboardData.overview.totalAnalyses.change}
                  </div>
                </div>
                <div className="text-sm text-gray-400">Total Analyses</div>
                <div className="text-xs text-gray-500">{mockDashboardData.overview.totalAnalyses.period}</div>
              </div>

              {/* Comments Analyzed */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <div className="text-2xl font-bold text-white">{mockDashboardData.overview.commentsAnalyzed.value}</div>
                  <div className="flex items-center text-green-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    {mockDashboardData.overview.commentsAnalyzed.change}%
                  </div>
                </div>
                <div className="text-sm text-gray-400">Comments Analyzed</div>
                <div className="text-xs text-gray-500">{mockDashboardData.overview.commentsAnalyzed.period}</div>
              </div>

              {/* Average Sentiment */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-green-400" />
                  <div className="text-2xl font-bold text-white">{mockDashboardData.overview.avgSentiment.value}%</div>
                  <div className="flex items-center text-green-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    {mockDashboardData.overview.avgSentiment.change}%
                  </div>
                </div>
                <div className="text-sm text-gray-400">Avg Sentiment</div>
                <div className="text-xs text-gray-500">{mockDashboardData.overview.avgSentiment.period}</div>
              </div>

              {/* Active Monitoring */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{mockDashboardData.overview.activeMonitoring.value}</div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Minus className="w-4 h-4" />
                    {mockDashboardData.overview.activeMonitoring.change}
                  </div>
                </div>
                <div className="text-sm text-gray-400">Active Posts</div>
                <div className="text-xs text-gray-500">{mockDashboardData.overview.activeMonitoring.period}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Recent Posts */}
            <div className="lg:col-span-4">
              <RecentPosts />
            </div>

            {/* Center Column - Recent Analyses & Insights */}
            <div className="lg:col-span-5 space-y-6">
              {/* Recent Analyses */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">Recent Analyses</CardTitle>
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockDashboardData.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {analysis.platform}
                            </Badge>
                            <Badge className={`text-xs ${analysis.status === "completed" ? "bg-green-500/20 text-green-400" : analysis.status === "processing" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>{analysis.status}</Badge>
                          </div>
                          <h4 className="text-white font-medium text-sm mb-1">{analysis.title}</h4>
                          <p className="text-xs text-gray-400">{analysis.timestamp}</p>
                        </div>
                        {analysis.alerts > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">
                            {analysis.alerts} alert{analysis.alerts > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {analysis.commentsAnalyzed.toLocaleString()}
                          </span>
                          <span className="text-gray-400">
                            <Target className="w-3 h-3 inline mr-1" />
                            {analysis.insights} insights
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400" style={{ opacity: analysis.sentiment.positive / 100 }}></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400" style={{ opacity: analysis.sentiment.neutral / 100 }}></div>
                          <div className="w-2 h-2 rounded-full bg-red-400" style={{ opacity: analysis.sentiment.negative / 100 }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Insights */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Trending Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockDashboardData.topInsights.map((insight, index) => (
                    <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {insight.type === "trending_topic" && <TrendingUp className="w-4 h-4 text-green-400" />}
                          {insight.type === "concern" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          {insight.type === "request" && <MessageSquare className="w-4 h-4 text-blue-400" />}
                          <h4 className="text-white font-medium text-sm">{insight.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{insight.mentions} mentions</span>
                          <Badge className={`text-xs ${insight.sentiment === "positive" ? "bg-green-500/20 text-green-400" : insight.sentiment === "negative" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{insight.growth}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Alerts & Quick Actions */}
            <div className="lg:col-span-3 space-y-6">
              {/* Alerts */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Alerts
                    </CardTitle>
                    <Badge className="bg-red-500/20 text-red-400 text-xs">{mockDashboardData.alerts.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockDashboardData.alerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${alert.severity === "high" ? "border-red-500/30 bg-red-500/5" : alert.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" : "border-blue-500/30 bg-blue-500/5"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`text-xs ${alert.severity === "high" ? "bg-red-500/20 text-red-400" : alert.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>{alert.type}</Badge>
                        <span className="text-xs text-gray-400">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm text-white mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-400">{alert.post}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-2" />
                    New Analysis
                  </Button>
                  <Button variant="outline" className="w-full border-white/10 bg-white/5">
                    <Activity className="w-4 h-4 mr-2" />
                    Monitor Post
                  </Button>
                  <Button variant="outline" className="w-full border-white/10 bg-white/5">
                    <Filter className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>

              {/* Time Range Selector */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Time Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <TabsList className="grid w-full grid-cols-3 bg-white/5">
                      <TabsTrigger value="24h" className="text-xs">
                        24h
                      </TabsTrigger>
                      <TabsTrigger value="7d" className="text-xs">
                        7d
                      </TabsTrigger>
                      <TabsTrigger value="30d" className="text-xs">
                        30d
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
