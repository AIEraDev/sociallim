/**
 * Analysis Dashboard Demo Page
 *
 * Demo page with mock data to showcase the analysis dashboard functionality
 * This helps with development and testing without requiring real API data
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AnalysisDashboard } from "@/components/analysis";
import { AnalysisResult, Sentiment, Platform } from "@/types";

// Mock analysis result data for demonstration
const mockAnalysisResult: AnalysisResult = {
  id: "demo-analysis-1",
  totalComments: 1247,
  filteredComments: 89,
  summary: "The overall sentiment towards this content is overwhelmingly positive, with viewers expressing excitement and appreciation for the creative approach. Many comments highlight the educational value and entertainment factor. Some constructive feedback suggests improvements for future content, while a small portion of negative sentiment relates to technical audio issues in the first few minutes.",
  analyzedAt: new Date().toISOString(),
  postId: "demo-post-1",
  userId: "demo-user-1",

  sentimentBreakdown: {
    id: "sentiment-1",
    positive: 0.72,
    negative: 0.15,
    neutral: 0.13,
    confidenceScore: 0.89,
  },

  emotions: [
    {
      id: "emotion-1",
      name: "joy",
      percentage: 45.2,
    },
    {
      id: "emotion-2",
      name: "love",
      percentage: 28.7,
    },
    {
      id: "emotion-3",
      name: "surprise",
      percentage: 12.1,
    },
    {
      id: "emotion-4",
      name: "anger",
      percentage: 8.3,
    },
    {
      id: "emotion-5",
      name: "sadness",
      percentage: 3.9,
    },
    {
      id: "emotion-6",
      name: "fear",
      percentage: 1.8,
    },
  ],

  themes: [
    {
      id: "theme-1",
      name: "Educational Content",
      frequency: 234,
      sentiment: Sentiment.POSITIVE,
      exampleComments: ["This is so helpful! I learned more in 10 minutes than I did in my entire class.", "Great explanation of complex concepts. Really appreciate the clear examples.", "Perfect tutorial for beginners. The step-by-step approach is fantastic."],
    },
    {
      id: "theme-2",
      name: "Production Quality",
      frequency: 187,
      sentiment: Sentiment.POSITIVE,
      exampleComments: ["The video quality is amazing! Love the editing and transitions.", "Such professional production value. You can tell a lot of effort went into this.", "The graphics and animations really help explain the concepts visually."],
    },
    {
      id: "theme-3",
      name: "Audio Issues",
      frequency: 92,
      sentiment: Sentiment.NEGATIVE,
      exampleComments: ["Audio is a bit quiet in the beginning, had to turn up my volume.", "There's some background noise around the 2-minute mark.", "Could use better audio quality, but content is still great."],
    },
    {
      id: "theme-4",
      name: "Request for More",
      frequency: 156,
      sentiment: Sentiment.POSITIVE,
      exampleComments: ["Please make more videos like this! Subscribed immediately.", "Can you do a follow-up video on advanced techniques?", "Would love to see this as a series. Part 2 when?"],
    },
    {
      id: "theme-5",
      name: "Comparison to Others",
      frequency: 78,
      sentiment: Sentiment.NEUTRAL,
      exampleComments: ["This is similar to what [other creator] did, but with your own twist.", "Reminds me of the tutorial I saw last week, but this one is clearer.", "Different approach than most tutorials I've seen. Interesting perspective."],
    },
  ],

  keywords: [
    {
      id: "keyword-1",
      word: "amazing",
      frequency: 89,
      sentiment: Sentiment.POSITIVE,
      contexts: ["This is amazing content!", "Amazing explanation of the concepts", "The quality is just amazing"],
    },
    {
      id: "keyword-2",
      word: "helpful",
      frequency: 76,
      sentiment: Sentiment.POSITIVE,
      contexts: ["So helpful for beginners", "Really helpful tutorial", "This was incredibly helpful"],
    },
    {
      id: "keyword-3",
      word: "confusing",
      frequency: 23,
      sentiment: Sentiment.NEGATIVE,
      contexts: ["The middle part was a bit confusing", "Found the explanation confusing", "Too confusing for beginners"],
    },
    {
      id: "keyword-4",
      word: "perfect",
      frequency: 67,
      sentiment: Sentiment.POSITIVE,
      contexts: ["Perfect timing for this tutorial", "This is perfect for my project", "Perfect explanation, thank you"],
    },
    {
      id: "keyword-5",
      word: "subscribe",
      frequency: 45,
      sentiment: Sentiment.POSITIVE,
      contexts: ["Definitely subscribing after this", "Subscribe for more content like this", "Just subscribed, keep it up"],
    },
    {
      id: "keyword-6",
      word: "audio",
      frequency: 34,
      sentiment: Sentiment.NEGATIVE,
      contexts: ["Audio quality could be better", "Had trouble with the audio", "Audio is too quiet"],
    },
    {
      id: "keyword-7",
      word: "clear",
      frequency: 58,
      sentiment: Sentiment.POSITIVE,
      contexts: ["Very clear explanation", "Clear and concise tutorial", "Crystal clear instructions"],
    },
    {
      id: "keyword-8",
      word: "love",
      frequency: 91,
      sentiment: Sentiment.POSITIVE,
      contexts: ["Love this type of content", "I love how you explain things", "Love the editing style"],
    },
  ],

  post: {
    id: "demo-post-1",
    platform: Platform.YOUTUBE,
    platformPostId: "demo-yt-123",
    title: "Complete Guide to Modern Web Development - From Beginner to Pro",
    url: "https://youtube.com/watch?v=demo123",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    createdAt: new Date().toISOString(),
    userId: "demo-user-1",
  },
};

export default function AnalysisDemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex-1">
              <h1 className="text-xl font-semibold">Analysis Dashboard Demo</h1>
              <p className="text-sm text-muted-foreground">Interactive demo showcasing the analysis dashboard with sample data</p>
            </div>
          </div>
        </motion.div>

        {/* Demo Dashboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <AnalysisDashboard result={mockAnalysisResult} />
        </motion.div>
      </div>
    </div>
  );
}
