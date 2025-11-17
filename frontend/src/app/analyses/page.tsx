"use client";

import { useState } from "react";
import { Search, Filter, Download, RefreshCw, Plus, Calendar, MessageSquare, Play, Pause, Settings, CheckSquare, Square, BarChart3, Clock, AlertTriangle, Eye, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import GlobalHeader from "@/components/GlobalHeader";
import { usePlatformStore } from "@/stores/platformStore";

// Mock data for analyses page
const mockPosts = [
  {
    id: 1,
    title: "Product Launch Video - The Future is Here",
    platform: "meta",
    publishedAt: "2024-01-15T10:30:00Z",
    totalComments: 2847,
    estimatedAnalysisTime: "4-6 minutes",
    thumbnailUrl: "/api/placeholder/120/80",
    engagement: { likes: 15420, shares: 892, views: 45600 },
    lastAnalyzed: null,
    isSelected: false,
  },
  {
    id: 2,
    title: "Behind the Scenes: How We Build Our Products",
    platform: "meta",
    publishedAt: "2024-01-14T15:45:00Z",
    totalComments: 1256,
    estimatedAnalysisTime: "2-3 minutes",
    thumbnailUrl: "/api/placeholder/120/80",
    engagement: { likes: 8930, shares: 445, views: 23400 },
    lastAnalyzed: "2024-01-14T16:00:00Z",
    isSelected: false,
  },
  {
    id: 3,
    title: "Quick Tutorial: 5 Tips for Better Content",
    platform: "tiktok",
    publishedAt: "2024-01-13T09:15:00Z",
    totalComments: 5623,
    estimatedAnalysisTime: "8-12 minutes",
    thumbnailUrl: "/api/placeholder/120/80",
    engagement: { likes: 34500, shares: 2100, views: 156000 },
    lastAnalyzed: null,
    isSelected: false,
  },
  {
    id: 4,
    title: "Industry Insights: What's Coming in 2024",
    platform: "twitter",
    publishedAt: "2024-01-12T14:20:00Z",
    totalComments: 892,
    estimatedAnalysisTime: "1-2 minutes",
    thumbnailUrl: "/api/placeholder/120/80",
    engagement: { likes: 4560, shares: 1200, views: 18900 },
    lastAnalyzed: "2024-01-12T15:00:00Z",
    isSelected: false,
  },
  {
    id: 5,
    title: "Live Q&A Session Highlights",
    platform: "meta",
    publishedAt: "2024-01-11T18:00:00Z",
    totalComments: 3421,
    estimatedAnalysisTime: "5-8 minutes",
    thumbnailUrl: "/api/placeholder/120/80",
    engagement: { likes: 12300, shares: 678, views: 67800 },
    lastAnalyzed: null,
    isSelected: false,
  },
];

const mockCompletedAnalyses = [
  {
    id: 1,
    title: "Behind the Scenes: How We Build Our Products",
    platform: "meta",
    commentsAnalyzed: 1256,
    sentiment: { positive: 72, neutral: 20, negative: 8 },
    status: "completed" as const,
    completedAt: "2024-01-14T16:00:00Z",
    insights: 5,
    alerts: 1,
    processingTime: "2m 34s",
  },
  {
    id: 2,
    title: "Industry Insights: What's Coming in 2024",
    platform: "twitter",
    commentsAnalyzed: 892,
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    status: "completed" as const,
    completedAt: "2024-01-12T15:00:00Z",
    insights: 3,
    alerts: 0,
    processingTime: "1m 45s",
  },
  {
    id: 3,
    title: "Customer Success Stories",
    platform: "tiktok",
    commentsAnalyzed: 2341,
    sentiment: { positive: 78, neutral: 15, negative: 7 },
    status: "completed" as const,
    completedAt: "2024-01-10T11:30:00Z",
    insights: 7,
    alerts: 2,
    processingTime: "4m 12s",
  },
];

export default function AnalysesPage() {
  const { selectedPlatform } = usePlatformStore();
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [analysisSettings, setAnalysisSettings] = useState({
    batchSize: 50,
    includeReplies: true,
    sentimentOnly: false,
  });
  const [activeTab, setActiveTab] = useState("select");

  const handlePostSelection = (postId: number) => {
    setSelectedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
  };

  const handleSelectAll = () => {
    const allPostIds = mockPosts.map((post) => post.id);
    setSelectedPosts((prev) => (prev.length === allPostIds.length ? [] : allPostIds));
  };

  const selectedPostsData = mockPosts.filter((post) => selectedPosts.includes(post.id));
  const totalCommentsToAnalyze = selectedPostsData.reduce((sum, post) => sum + Math.min(post.totalComments, analysisSettings.batchSize), 0);
  const estimatedTime = selectedPostsData.length * 2; // 2 minutes per post average

  return (
    <AppLayout>
      <div className="transition-all duration-300">
        {/* Global Header / Controls */}
        <GlobalHeader />

        <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Comment Analysis</h1>
            <p className="text-gray-400">Analyze comments from your {selectedPlatform} posts to understand audience sentiment and insights</p>
          </div>

          {/* Analysis Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="select">Select Posts</TabsTrigger>
              <TabsTrigger value="history">Analysis History</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Select Posts Tab */}
            <TabsContent value="select" className="space-y-6">
              {/* Analysis Configuration */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Analysis Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure how many comments to analyze per post (max 50 to prevent overload)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Comments per Post</label>
                      <Select value={analysisSettings.batchSize.toString()} onValueChange={(value) => setAnalysisSettings((prev) => ({ ...prev, batchSize: parseInt(value) }))}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 comments</SelectItem>
                          <SelectItem value="50">50 comments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="replies" checked={analysisSettings.includeReplies} onCheckedChange={(checked) => setAnalysisSettings((prev) => ({ ...prev, includeReplies: !!checked }))} />
                      <label htmlFor="replies" className="text-sm text-gray-300">
                        Include replies
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sentiment" checked={analysisSettings.sentimentOnly} onCheckedChange={(checked) => setAnalysisSettings((prev) => ({ ...prev, sentimentOnly: !!checked }))} />
                      <label htmlFor="sentiment" className="text-sm text-gray-300">
                        Sentiment only
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Post Selection */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">Select Posts to Analyze</CardTitle>
                      <CardDescription className="text-gray-400">Choose posts from your {selectedPlatform} account</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll} className="border-white/10 bg-white/5">
                        {selectedPosts.length === mockPosts.length ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select All
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Posts
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPosts.map((post) => (
                      <div key={post.id} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedPosts.includes(post.id) ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`} onClick={() => handlePostSelection(post.id)}>
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedPosts.includes(post.id)}
                            onChange={() => {}} // Handled by parent click
                            className="mt-1"
                          />

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-white font-medium mb-1">{post.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <Badge variant="outline" className="text-xs">
                                    {post.platform}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(post.publishedAt).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {post.totalComments.toLocaleString()} comments
                                  </span>
                                </div>
                              </div>
                              {post.lastAnalyzed && <Badge className="bg-green-500/20 text-green-400 text-xs">Previously analyzed</Badge>}
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Will analyze:</span>
                                <div className="text-white font-medium">{Math.min(post.totalComments, analysisSettings.batchSize).toLocaleString()} comments</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Est. time:</span>
                                <div className="text-white font-medium">{post.estimatedAnalysisTime}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Engagement:</span>
                                <div className="flex items-center gap-2 text-white font-medium">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {(post.engagement.views / 1000).toFixed(1)}K
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Summary & Start */}
              {selectedPosts.length > 0 && (
                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{selectedPosts.length}</div>
                        <div className="text-sm text-gray-400">Posts Selected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{totalCommentsToAnalyze.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Comments to Analyze</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">~{estimatedTime}m</div>
                        <div className="text-sm text-gray-400">Estimated Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{analysisSettings.batchSize}</div>
                        <div className="text-sm text-gray-400">Per Post Limit</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Play className="w-4 h-4 mr-2" />
                        Start Analysis
                      </Button>
                      <Button variant="outline" className="border-white/10 bg-white/5">
                        <Settings className="w-4 h-4 mr-2" />
                        Advanced Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analysis History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">Analysis History</CardTitle>
                      <CardDescription className="text-gray-400">View your completed comment analyses</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCompletedAnalyses.map((analysis) => (
                    <div key={analysis.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {analysis.platform}
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-400 text-xs">{analysis.status}</Badge>
                            {analysis.alerts > 0 && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">
                                {analysis.alerts} alert{analysis.alerts > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-white font-medium mb-1">{analysis.title}</h4>
                          <p className="text-sm text-gray-400">
                            Completed {new Date(analysis.completedAt).toLocaleDateString()} • {analysis.processingTime}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Comments:</span>
                          <div className="text-white font-medium">{analysis.commentsAnalyzed.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Insights:</span>
                          <div className="text-white font-medium">{analysis.insights}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Sentiment:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400" style={{ opacity: analysis.sentiment.positive / 100 }}></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-400" style={{ opacity: analysis.sentiment.neutral / 100 }}></div>
                            <div className="w-2 h-2 rounded-full bg-red-400" style={{ opacity: analysis.sentiment.negative / 100 }}></div>
                            <span className="text-white ml-1">{analysis.sentiment.positive}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Processing:</span>
                          <div className="text-white font-medium">{analysis.processingTime}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Analysis Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Average Processing Time</span>
                        <span className="text-white font-medium">2m 47s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Comments per Minute</span>
                        <span className="text-white font-medium">~18</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-green-400 font-medium">98.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Analyses</span>
                        <span className="text-white font-medium">47</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Comments Analyzed</span>
                        <span className="text-white font-medium">156.2K</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">This Month</span>
                        <span className="text-white font-medium">12 analyses</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  );
}
