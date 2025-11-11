"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PostAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: {
    id: number;
    title: string;
    platform: string;
    comments: number;
    sentiment: { positive: number; neutral: number; negative: number };
    emotions?: { joy: number; anger: number; sadness: number; fear: number; surprise: number };
    commentClusters?: Array<{ theme: string; count: number; sample: string[] }>;
  };
}

export function PostAnalysisModal({ open, onOpenChange, analysis }: PostAnalysisModalProps) {
  const emotions = analysis.emotions || { joy: 45, anger: 12, sadness: 8, fear: 5, surprise: 30 };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border-white/20 bg-[var(--vr-bg)]">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">{analysis.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--vr-success)] mb-1">{analysis.sentiment.positive}%</div>
                  <div className="text-sm text-[var(--vr-muted)]">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--vr-neutral)] mb-1">{analysis.sentiment.neutral}%</div>
                  <div className="text-sm text-[var(--vr-muted)]">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--vr-danger)] mb-1">{analysis.sentiment.negative}%</div>
                  <div className="text-sm text-[var(--vr-muted)]">Negative</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donut Chart Placeholder */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Positive */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--vr-success)" strokeWidth="12" strokeDasharray={`${(analysis.sentiment.positive / 100) * 251.2} 251.2`} strokeLinecap="round" />
                    {/* Neutral */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--vr-neutral)" strokeWidth="12" strokeDasharray={`${(analysis.sentiment.neutral / 100) * 251.2} 251.2`} strokeDashoffset={-(analysis.sentiment.positive / 100) * 251.2} strokeLinecap="round" />
                    {/* Negative */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--vr-danger)" strokeWidth="12" strokeDasharray={`${(analysis.sentiment.negative / 100) * 251.2} 251.2`} strokeDashoffset={-((analysis.sentiment.positive + analysis.sentiment.neutral) / 100) * 251.2} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emotion Bars */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Emotion Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(emotions).map(([emotion, value]) => (
                <div key={emotion}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white capitalize">{emotion}</span>
                    <span className="text-sm text-[var(--vr-muted)]">{value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full bg-gradient-primary rounded-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comment Clusters */}
          {analysis.commentClusters && analysis.commentClusters.length > 0 && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Comment Clusters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.commentClusters.map((cluster, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{cluster.theme}</h4>
                      <Badge variant="secondary" className="bg-white/5 text-[var(--vr-muted)]">
                        {cluster.count} comments
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {cluster.sample.map((comment, i) => (
                        <div key={i} className="text-sm text-[var(--vr-muted)] pl-4 border-l-2 border-white/10">
                          "{comment}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggested Replies */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Suggested Replies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate AI Reply
                </Button>
                <p className="text-sm text-[var(--vr-muted)]">Get AI-suggested replies based on sentiment and context</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
