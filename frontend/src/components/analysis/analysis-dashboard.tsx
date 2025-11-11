/**
 * Analysis Results Dashboard Component
 *
 * A comprehensive dashboard for displaying sentiment analysis results with:
 * - Interactive sentiment breakdown charts
 * - Beautiful theme and keyword clouds
 * - Summary cards with emotion indicators
 * - Advanced filtering and search capabilities
 * - Export functionality with elegant modals
 * - Responsive grid layouts
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, PieChart, TrendingUp, TrendingDown, Minus, Search, Filter, Download, Share2, Eye, EyeOff, Calendar, MessageSquare, Users, Heart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AnalysisResult } from "@/types";
import { cn } from "@/lib/utils";

import { SentimentChart } from "./sentiment-chart";
import { ThemeCloud } from "./theme-cloud";
import { KeywordCloud } from "./keyword-cloud";
import { EmotionIndicators } from "./emotion-indicators";
import { ExportModal } from "./export-modal";

interface AnalysisDashboardProps {
  result: AnalysisResult;
  className?: string;
}

// Emotion icon mapping
// const emotionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
//   joy: Smile,
//   happiness: Smile,
//   love: Heart,
//   anger: Angry,
//   sadness: Frown,
//   fear: AlertTriangle,
//   surprise: Zap,
//   neutral: Meh,
// };

// Filter and sort options
const sortOptions = [
  { value: "frequency", label: "Frequency" },
  { value: "sentiment", label: "Sentiment" },
  { value: "alphabetical", label: "Alphabetical" },
];

const sentimentFilters = [
  { value: "all", label: "All Sentiments" },
  { value: "positive", label: "Positive Only" },
  { value: "negative", label: "Negative Only" },
  { value: "neutral", label: "Neutral Only" },
];

export function AnalysisDashboard({ result, className }: AnalysisDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [sortBy, setSortBy] = useState("frequency");
  const [showExportModal, setShowExportModal] = useState(false);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());

  // Memoized filtered and sorted data
  const filteredThemes = useMemo(() => {
    let themes = result.themes || [];

    // Apply search filter
    if (searchQuery) {
      themes = themes.filter((theme) => theme.name.toLowerCase().includes(searchQuery.toLowerCase()) || theme.exampleComments.some((comment) => comment.toLowerCase().includes(searchQuery.toLowerCase())));
    }

    // Apply sentiment filter
    if (selectedSentiment !== "all") {
      themes = themes.filter((theme) => theme.sentiment.toLowerCase() === selectedSentiment);
    }

    // Apply sorting
    themes.sort((a, b) => {
      switch (sortBy) {
        case "frequency":
          return b.frequency - a.frequency;
        case "sentiment":
          return a.sentiment.localeCompare(b.sentiment);
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return themes;
  }, [result.themes, searchQuery, selectedSentiment, sortBy]);

  const filteredKeywords = useMemo(() => {
    let keywords = result.keywords || [];

    // Apply search filter
    if (searchQuery) {
      keywords = keywords.filter((keyword) => keyword.word.toLowerCase().includes(searchQuery.toLowerCase()) || keyword.contexts.some((context) => context.toLowerCase().includes(searchQuery.toLowerCase())));
    }

    // Apply sentiment filter
    if (selectedSentiment !== "all") {
      keywords = keywords.filter((keyword) => keyword.sentiment.toLowerCase() === selectedSentiment);
    }

    // Apply sorting
    keywords.sort((a, b) => {
      switch (sortBy) {
        case "frequency":
          return b.frequency - a.frequency;
        case "sentiment":
          return a.sentiment.localeCompare(b.sentiment);
        case "alphabetical":
          return a.word.localeCompare(b.word);
        default:
          return 0;
      }
    });

    return keywords;
  }, [result.keywords, searchQuery, selectedSentiment, sortBy]);

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    const newHidden = new Set(hiddenSections);
    if (newHidden.has(sectionId)) {
      newHidden.delete(sectionId);
    } else {
      newHidden.add(sectionId);
    }
    setHiddenSections(newHidden);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const breakdown = result.sentimentBreakdown;
    if (!breakdown) return null;

    const total = breakdown.positive + breakdown.negative + breakdown.neutral;
    const dominantSentiment = breakdown.positive > breakdown.negative && breakdown.positive > breakdown.neutral ? "positive" : breakdown.negative > breakdown.positive && breakdown.negative > breakdown.neutral ? "negative" : "neutral";

    return {
      total,
      dominantSentiment,
      confidence: breakdown.confidenceScore,
      positivePercentage: (breakdown.positive / total) * 100,
      negativePercentage: (breakdown.negative / total) * 100,
      neutralPercentage: (breakdown.neutral / total) * 100,
    };
  }, [result.sentimentBreakdown]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">
              Analyzed {result.totalComments} comments • {result.filteredComments} filtered
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search themes, keywords, or comments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </div>

              <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sentimentFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Overview */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                    <p className="text-2xl font-bold">{result.totalComments}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dominant Sentiment</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold capitalize">{summaryStats.dominantSentiment}</p>
                      {summaryStats.dominantSentiment === "positive" && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {summaryStats.dominantSentiment === "negative" && <TrendingDown className="h-5 w-5 text-red-500" />}
                      {summaryStats.dominantSentiment === "neutral" && <Minus className="h-5 w-5 text-gray-500" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                    <p className="text-2xl font-bold">{(summaryStats.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Analysis Date</p>
                    <p className="text-lg font-semibold">{new Date(result.analyzedAt).toLocaleDateString()}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Breakdown Chart */}
          <AnimatePresence>
            {!hiddenSections.has("sentiment") && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Sentiment Breakdown
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleSection("sentiment")}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>{result.sentimentBreakdown && <SentimentChart breakdown={result.sentimentBreakdown} />}</CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emotion Indicators */}
          <AnimatePresence>
            {!hiddenSections.has("emotions") && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Emotion Analysis
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleSection("emotions")}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <EmotionIndicators emotions={result.emotions} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary Card */}
        <AnimatePresence>
          {!hiddenSections.has("summary") && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    AI Summary
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => toggleSection("summary")}>
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Themes and Keywords Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Cloud */}
          <AnimatePresence>
            {!hiddenSections.has("themes") && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Themes ({filteredThemes.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleSection("themes")}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ThemeCloud themes={filteredThemes} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyword Cloud */}
          <AnimatePresence>
            {!hiddenSections.has("keywords") && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Keywords ({filteredKeywords.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleSection("keywords")}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <KeywordCloud keywords={filteredKeywords} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden sections indicator */}
        {hiddenSections.size > 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {hiddenSections.size} section{hiddenSections.size > 1 ? "s" : ""} hidden
                </p>
                <Button variant="outline" size="sm" onClick={() => setHiddenSections(new Set())}>
                  <Eye className="h-4 w-4 mr-2" />
                  Show All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Export Modal */}
        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} analysisResult={result} />
      </div>
    </TooltipProvider>
  );
}
