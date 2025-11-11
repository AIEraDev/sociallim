"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MessageSquare, Users, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { KPICard } from "@/components/dashboard/kpi-card";

const analyticsStats = [
  {
    title: "Total Comments",
    value: "45,892",
    change: "+18.3%",
    trend: "up" as const,
    icon: MessageSquare,
    sparkline: [32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000, 40000, 41000, 42000, 43000, 44000, 45000, 46000, 47000, 48000, 49000, 50000, 52000],
  },
  {
    title: "Avg. Sentiment",
    value: "74.2%",
    change: "+6.1%",
    trend: "up" as const,
    icon: TrendingUp,
    sparkline: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 74, 75, 76, 75, 76, 77, 76, 77, 78],
  },
  {
    title: "Active Users",
    value: "12,847",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    sparkline: [10000, 10200, 10400, 10600, 10800, 11000, 11200, 11400, 11600, 11800, 12000, 12200, 12400, 12600, 12800, 13000, 13200, 13400, 13600, 13800],
  },
  {
    title: "Platforms",
    value: "5",
    change: "+1",
    trend: "up" as const,
    icon: BarChart3,
    sparkline: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
  },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Sidebar />
      <div className="transition-all duration-300">
        <Topbar />
        <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-[var(--vr-muted)]">Comprehensive insights into your sentiment data</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" className="border-border bg-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 days
            </Button>
            <Button variant="outline" className="border-border bg-secondary">
              Last 7 days
            </Button>
            <Button variant="outline" className="border-border bg-secondary">
              Last 90 days
            </Button>
            <Button variant="outline" className="border-border bg-secondary">
              All time
            </Button>
          </div>

          {/* KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analyticsStats.map((stat, index) => (
              <KPICard key={stat.title} {...stat} delay={index * 0.1} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sentiment Trend</CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Sentiment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-[var(--vr-muted)]">Chart placeholder - Sentiment trend visualization</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Platform Distribution</CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Comments by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-[var(--vr-muted)]">Chart placeholder - Platform distribution</div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["amazing", "love", "great", "awesome", "perfect"].map((keyword, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                      <span className="text-sm font-medium text-foreground">{keyword}</span>
                      <span className="text-sm text-[var(--vr-muted)]">{100 - i * 15}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Emotion Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { emotion: "Joy", value: 45, color: "var(--vr-success)" },
                    { emotion: "Surprise", value: 30, color: "var(--vr-accent-2)" },
                    { emotion: "Anger", value: 12, color: "var(--vr-danger)" },
                    { emotion: "Sadness", value: 8, color: "var(--vr-neutral)" },
                    { emotion: "Fear", value: 5, color: "var(--vr-muted)" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{item.emotion}</span>
                        <span className="text-sm text-[var(--vr-muted)]">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { time: "2:00 PM", comments: 1247 },
                    { time: "6:00 PM", comments: 892 },
                    { time: "10:00 AM", comments: 756 },
                    { time: "8:00 PM", comments: 643 },
                    { time: "12:00 PM", comments: 521 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                      <span className="text-sm font-medium text-foreground">{item.time}</span>
                      <span className="text-sm text-[var(--vr-muted)]">{item.comments.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
