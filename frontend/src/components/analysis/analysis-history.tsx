/**
 * Analysis History Component
 *
 * Comprehensive analysis history with:
 * - Timeline view with chronological organization
 * - Advanced search and filtering capabilities
 * - Batch operations and selection
 * - Performance metrics and trends
 * - Quick actions and navigation
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, BarChart3, TrendingUp, TrendingDown, Eye, Download, Trash2, MoreHorizontal, Clock, MessageSquare, Circle, Grid3X3, List, SortAsc, SortDesc } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { AnalysisResult, Platform, Sentiment } from "@/types";
import { useAnalysisHistory } from "@/hooks/use-analysis";
import { cn } from "@/lib/utils";

interface AnalysisHistoryProps {
  onSelectAnalysis?: (analysis: AnalysisResult) => void;
  onCompareAnalyses?: (analyses: AnalysisResult[]) => void;
  className?: string;
}

type ViewMode = "timeline" | "grid" | "list";
type SortField = "date" | "comments" | "engagement" | "platform";
type SortOrder = "asc" | "desc";

interface FilterState {
  search: string;
  platform: Platform | "all";
  sentiment: Sentiment | "all";
  dateRange: "all" | "week" | "month" | "quarter" | "year";
}

export function AnalysisHistory({ onSelectAnalysis, onCompareAnalyses, className }: AnalysisHistoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    platform: "all",
    sentiment: "all",
    dateRange: "all",
  });

  const { history, isLoading, error } = useAnalysisHistory();

  // Filter and sort analyses
  const filteredAndSortedAnalyses = useMemo(() => {
    if (!history) return [];

    const filtered = history.filter((analysis) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = analysis.post?.title?.toLowerCase().includes(searchLower);
        const matchesSummary = analysis.summary.toLowerCase().includes(searchLower);
        const matchesThemes = analysis.themes?.some((theme) => theme.name.toLowerCase().includes(searchLower));
        if (!matchesTitle && !matchesSummary && !matchesThemes) return false;
      }

      // Platform filter
      if (filters.platform !== "all" && analysis.post?.platform !== filters.platform) {
        return false;
      }

      // Sentiment filter
      if (filters.sentiment !== "all") {
        const breakdown = analysis.sentimentBreakdown;
        if (!breakdown) return false;

        const dominantSentiment = breakdown.positive > breakdown.negative && breakdown.positive > breakdown.neutral ? "POSITIVE" : breakdown.negative > breakdown.positive && breakdown.negative > breakdown.neutral ? "NEGATIVE" : "NEUTRAL";

        if (dominantSentiment !== filters.sentiment) return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const analysisDate = new Date(analysis.analyzedAt);
        const now = new Date();
        const diffTime = now.getTime() - analysisDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
          case "quarter":
            if (diffDays > 90) return false;
            break;
          case "year":
            if (diffDays > 365) return false;
            break;
        }
      }

      return true;
    });

    // Sort analyses
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
          break;
        case "comments":
          comparison = a.totalComments - b.totalComments;
          break;
        case "engagement":
          const aEngagement = a.sentimentBreakdown ? a.sentimentBreakdown.positive * 100 - a.sentimentBreakdown.negative * 50 : 0;
          const bEngagement = b.sentimentBreakdown ? b.sentimentBreakdown.positive * 100 - b.sentimentBreakdown.negative * 50 : 0;
          comparison = aEngagement - bEngagement;
          break;
        case "platform":
          comparison = (a.post?.platform || "").localeCompare(b.post?.platform || "");
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [history, filters, sortField, sortOrder]);

  // Group analyses by date for timeline view
  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, AnalysisResult[]> = {};

    filteredAndSortedAnalyses.forEach((analysis) => {
      const date = new Date(analysis.analyzedAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(analysis);
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredAndSortedAnalyses]);

  // Handle selection
  const handleSelectAnalysis = (analysisId: string, checked: boolean) => {
    const newSelected = new Set(selectedAnalyses);
    if (checked) {
      newSelected.add(analysisId);
    } else {
      newSelected.delete(analysisId);
    }
    setSelectedAnalyses(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnalyses(new Set(filteredAndSortedAnalyses.map((a) => a.id)));
    } else {
      setSelectedAnalyses(new Set());
    }
  };

  // Get sentiment color and icon
  const getSentimentInfo = (analysis: AnalysisResult) => {
    const breakdown = analysis.sentimentBreakdown;
    if (!breakdown) return { color: "text-gray-500", icon: Circle, label: "Unknown" };

    const dominant = breakdown.positive > breakdown.negative && breakdown.positive > breakdown.neutral ? "positive" : breakdown.negative > breakdown.positive && breakdown.negative > breakdown.neutral ? "negative" : "neutral";

    switch (dominant) {
      case "positive":
        return { color: "text-green-500", icon: TrendingUp, label: "Positive" };
      case "negative":
        return { color: "text-red-500", icon: TrendingDown, label: "Negative" };
      default:
        return { color: "text-gray-500", icon: Circle, label: "Neutral" };
    }
  };

  // Render analysis card
  const renderAnalysisCard = (analysis: AnalysisResult, compact = false) => {
    const sentimentInfo = getSentimentInfo(analysis);
    const SentimentIcon = sentimentInfo.icon;
    const isSelected = selectedAnalyses.has(analysis.id);

    return (
      <motion.div key={analysis.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("group relative", compact && "mb-3")}>
        <Card className={cn("cursor-pointer transition-all duration-200 hover:shadow-md", isSelected && "ring-2 ring-primary border-primary")}>
          <CardContent className={cn("pt-4", compact && "py-3")}>
            <div className="flex items-start gap-3">
              <Checkbox checked={isSelected} onCheckedChange={(checked) => handleSelectAnalysis(analysis.id, checked as boolean)} className="mt-1" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium truncate">{analysis.post?.title || `Analysis ${analysis.id.slice(0, 8)}`}</h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectAnalysis?.(analysis)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {analysis.totalComments} comments
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(analysis.analyzedAt).toLocaleDateString()}
                  </span>
                  {analysis.post?.platform && (
                    <Badge variant="outline" className="text-xs">
                      {analysis.post.platform}
                    </Badge>
                  )}
                </div>

                {!compact && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{analysis.summary}</p>}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SentimentIcon className={cn("h-4 w-4", sentimentInfo.color)} />
                    <span className="text-sm font-medium">{sentimentInfo.label}</span>
                    {analysis.sentimentBreakdown && <span className="text-xs text-muted-foreground">({(analysis.sentimentBreakdown.confidenceScore * 100).toFixed(0)}% confidence)</span>}
                  </div>

                  {analysis.themes && analysis.themes.length > 0 && (
                    <div className="flex gap-1">
                      {analysis.themes.slice(0, 2).map((theme, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {theme.name}
                        </Badge>
                      ))}
                      {analysis.themes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{analysis.themes.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load analysis history</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analysis History</h1>
            <p className="text-muted-foreground">
              {filteredAndSortedAnalyses.length} of {history?.length || 0} analyses
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedAnalyses.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selected = filteredAndSortedAnalyses.filter((a) => selectedAnalyses.has(a.id));
                  onCompareAnalyses?.(selected);
                }}
                disabled={selectedAnalyses.size < 2}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare ({selectedAnalyses.size})
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button variant={viewMode === "timeline" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("timeline")} className="rounded-r-none">
                <Clock className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-none border-x">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search analyses, themes, or content..." value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} className="pl-10" />
                </div>
              </div>

              <Select value={filters.platform} onValueChange={(value) => setFilters((prev) => ({ ...prev, platform: value as Platform | "all" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="TWITTER">Twitter</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sentiment} onValueChange={(value) => setFilters((prev) => ({ ...prev, sentiment: value as Sentiment | "all" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="POSITIVE">Positive</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="NEGATIVE">Negative</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.dateRange} onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value as FilterState["dateRange"] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort and Bulk Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox checked={selectedAnalyses.size === filteredAndSortedAnalyses.length && filteredAndSortedAnalyses.length > 0} onCheckedChange={handleSelectAll} />
                <span className="text-sm text-muted-foreground">Select all ({filteredAndSortedAnalyses.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="comments">Comments</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}>
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAndSortedAnalyses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No analyses found</h3>
                <p className="text-muted-foreground">{filters.search || filters.platform !== "all" || filters.sentiment !== "all" || filters.dateRange !== "all" ? "Try adjusting your filters to see more results" : "Start by analyzing some posts to see your history here"}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {viewMode === "timeline" ? (
              // Timeline View
              <div className="space-y-8">
                {groupedAnalyses.map(([date, analyses]) => (
                  <div key={date} className="relative">
                    <div className="sticky top-4 z-10 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-background border rounded-lg px-3 py-1">
                          <span className="text-sm font-medium">
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-border" />
                        <Badge variant="secondary">{analyses.length} analyses</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{analyses.map((analysis) => renderAnalysisCard(analysis))}</div>
                  </div>
                ))}
              </div>
            ) : viewMode === "grid" ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredAndSortedAnalyses.map((analysis) => renderAnalysisCard(analysis))}</div>
            ) : (
              // List View
              <div className="space-y-2">{filteredAndSortedAnalyses.map((analysis) => renderAnalysisCard(analysis, true))}</div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
