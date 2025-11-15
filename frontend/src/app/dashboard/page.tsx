"use client";

/*** Sociallim Dashboard - Redesigned for Comment Analysis ***/

import { useState } from "react";

import { RefreshCw, Save, ExternalLink, AlertTriangle, MessageSquare, BarChart3, Tag, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

import AppLayout from "@/components/AppLayout";
import GlobalHeader from "@/components/GlobalHeader";
import RecentPosts from "@/components/dashboard/RecentPosts";
import { usePlatformStore } from "@/stores/platformStore";

// Mock data for the redesigned dashboard
const mockKPIData = {
  totalComments: { value: "12,847", change: "+12.5%", period: "last 24h" },
  sentimentSnapshot: { positive: 68.2, neutral: 23.1, negative: 8.7 },
  engagementRate: { value: "45.2", unit: "comments/hour" },
  alerts: { count: 3, unread: 2 },
  lastAnalysis: { timestamp: "2 minutes ago", model: "v2.1.3" },
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
  const [selectedPost] = useState<number | null>(1); // Default to first post

  const currentPost = selectedPost ? mockSelectedPost : null;

  return (
    <AppLayout>
      <div className="transition-all duration-300">
        {/* Global Header / Controls */}
        <GlobalHeader />

        {/* KPI Strip */}
        <div className="border-b border-white/10 bg-black/10">
          <div className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Total Comments */}
              <div className="text-center">
                <div className="text-2xl font-bold text-white"> {mockKPIData.totalComments.value}</div>
                <div className="text-sm text-gray-400">Total Comments</div>
                <div className="text-xs text-green-400">
                  {mockKPIData.totalComments.change} {mockKPIData.totalComments.period}
                </div>
              </div>

              {/* Sentiment Snapshot */}
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-1">
                  <div className="text-green-400 font-semibold">{mockKPIData.sentimentSnapshot.positive}%</div>
                  <div className="text-gray-400">/</div>
                  <div className="text-yellow-400 font-semibold">{mockKPIData.sentimentSnapshot.neutral}%</div>
                  <div className="text-gray-400">/</div>
                  <div className="text-red-400 font-semibold">{mockKPIData.sentimentSnapshot.negative}%</div>
                </div>
                <div className="text-sm text-gray-400">Pos / Neu / Neg</div>
              </div>

              {/* Engagement Rate */}
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{mockKPIData.engagementRate.value}</div>
                <div className="text-sm text-gray-400">{mockKPIData.engagementRate.unit}</div>
              </div>

              {/* Alerts */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{mockKPIData.alerts.count}</span>
                  <Badge className="bg-red-500 text-white text-xs ml-1">{mockKPIData.alerts.unread}</Badge>
                </div>
                <div className="text-sm text-gray-400">Alerts</div>
              </div>

              {/* Last Analysis */}
              <div className="text-center">
                <div className="text-sm font-medium text-white">{mockKPIData.lastAnalysis.timestamp}</div>
                <div className="text-xs text-gray-400">Model {mockKPIData.lastAnalysis.model}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Three Column Layout */}
        <main className="w-full px-4 sm:px-6 py-6">
          <div className="flex gap-4">
            {/* Left Column - Recent Posts/Active Streams */}
            <RecentPosts />

            {/* Center Column - Post Analysis */}
            <div className="w-120">
              {currentPost ? (
                <div className="space-y-6">
                  {/* Post Header */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{currentPost.platform}</Badge>
                            <Badge className={`${currentPost.cacheStatus === "Live" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>{currentPost.cacheStatus}</Badge>
                            {currentPost.cacheExpiry && <span className="text-xs text-gray-400">Expires in {currentPost.cacheExpiry}</span>}
                          </div>
                          <CardTitle className="text-white">{currentPost.title}</CardTitle>
                        </div>
                        <Button size="sm" variant="ghost" className="text-gray-400">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-fetch
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Re-analyze
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Summary Card */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{currentPost.summary}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Sentiment</span>
                            <span className="text-sm text-white">{currentPost.confidence}% confidence</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-400">Positive</span>
                              <span className="text-white">{currentPost.sentiment.positive}%</span>
                            </div>
                            <Progress value={currentPost.sentiment.positive} className="h-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-yellow-400">Neutral</span>
                              <span className="text-white">{currentPost.sentiment.neutral}%</span>
                            </div>
                            <Progress value={currentPost.sentiment.neutral} className="h-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-red-400">Negative</span>
                              <span className="text-white">{currentPost.sentiment.negative}%</span>
                            </div>
                            <Progress value={currentPost.sentiment.negative} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentPost.insights.map((insight, index) => (
                        <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{insight.title}</h4>
                            <Badge variant="outline">{insight.count} mentions</Badge>
                          </div>
                          <div className="space-y-1">
                            {insight.sample.map((comment, i) => (
                              <p key={i} className="text-sm text-gray-400 italic">
                                &quot;{comment}&quot;
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Comment Clusters */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Comment Clusters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentPost.commentClusters.map((cluster, index) => (
                        <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{cluster.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{cluster.percent}%</span>
                              <Badge className={`text-xs ${cluster.sentiment === "positive" ? "bg-green-500/20 text-green-400" : cluster.sentiment === "negative" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{cluster.sentiment}</Badge>
                            </div>
                          </div>
                          <div className="space-y-1 mb-3">
                            {cluster.samples.map((comment, i) => (
                              <p key={i} className="text-sm text-gray-400 italic">
                                &quot;{comment}&quot;
                              </p>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              Reply to Cluster
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              Flag Cluster
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              Save as Issue
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Comments */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Recent Comments</CardTitle>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentPost.recentComments.map((comment) => (
                        <div key={comment.id} className={`p-3 rounded-lg border ${comment.flagged ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{comment.author}</span>
                                <span className="text-xs text-gray-400">{comment.time}</span>
                                {comment.flagged && <Badge className="bg-red-500/20 text-red-400 text-xs">Flagged</Badge>}
                              </div>
                              <p className="text-sm text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="glass-card border-white/20">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Select a post to view analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Analytics & Controls */}
            <div className="hidden lg:col-span-3 space-y-6">
              <>
                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Comment Volume (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {mockAnalytics.commentVolume.map((value, index) => (
                        <div key={index} className="bg-blue-500/30 rounded-t" style={{ height: `${(value / 100) * 100}%`, width: "3px" }} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Top Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mockAnalytics.topKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Moderation Queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockAnalytics.moderationQueue.map((item) => (
                      <div key={item.id} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-xs ${item.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{item.reason}</Badge>
                          <span className="text-xs text-gray-400">{item.severity}</span>
                        </div>
                        <p className="text-xs text-gray-300 truncate">{item.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Privacy & Retention</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Save Transcripts</span>
                      <Switch />
                    </div>
                    <Button size="sm" variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10">
                      Delete Cached Comments
                    </Button>
                  </CardContent>
                </Card>
              </>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
