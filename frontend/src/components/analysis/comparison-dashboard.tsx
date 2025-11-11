/**
 * Multi-Analysis Comparison Dashboard
 *
 * Sophisticated dashboard for comparing multiple analysis results with:
 * - Side-by-side sentiment comparisons
 * - Drag-and-drop analysis selection
 * - Performance metrics and insights
 * - Interactive charts and visualizations
 * - Trend analysis and recommendations
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Plus, X, Grip, ArrowRight, Trophy, Target, Lightbulb, Calendar, MessageSquare, Users, Zap } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AnalysisResult } from "@/types";
import { useComparison, useComparisonSelection, useAnalysisMetrics } from "@/hooks/use-comparison";
import { cn } from "@/lib/utils";

import { SentimentChart } from "./sentiment-chart";

interface ComparisonDashboardProps {
  className?: string;
}

interface ComparisonItem {
  id: string;
  analysis: AnalysisResult;
  color: string;
}

const COMPARISON_COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500"];

export function ComparisonDashboard({ className }: ComparisonDashboardProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<ComparisonItem[]>([]);
  const [availableAnalysis, setAvailableAnalysis] = useState<string>("");

  const { availableAnalyses } = useComparisonSelection();
  const { compareAnalyses, isComparing, comparisonResult } = useComparison();
  const { metrics, insights } = useAnalysisMetrics(selectedAnalyses.map((item) => item.analysis));

  // Handle adding analysis to comparison
  const handleAddAnalysis = useCallback(
    (analysisId: string) => {
      const analysis = availableAnalyses.find((a) => a.id === analysisId);
      if (!analysis || selectedAnalyses.some((item) => item.id === analysisId)) return;

      const newItem: ComparisonItem = {
        id: analysisId,
        analysis,
        color: COMPARISON_COLORS[selectedAnalyses.length % COMPARISON_COLORS.length],
      };

      setSelectedAnalyses((prev) => [...prev, newItem]);
      setAvailableAnalysis("");
    },
    [availableAnalyses, selectedAnalyses]
  );

  // Handle removing analysis from comparison
  const handleRemoveAnalysis = useCallback((analysisId: string) => {
    setSelectedAnalyses((prev) => prev.filter((item) => item.id !== analysisId));
  }, []);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(selectedAnalyses);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setSelectedAnalyses(items);
    },
    [selectedAnalyses]
  );

  // Run comparison when analyses are selected
  const handleRunComparison = useCallback(() => {
    if (selectedAnalyses.length >= 2) {
      compareAnalyses({
        analysisIds: selectedAnalyses.map((item) => item.id),
      });
    }
  }, [selectedAnalyses, compareAnalyses]);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analysis Comparison</h1>
            <p className="text-muted-foreground">Compare multiple analyses to identify trends and patterns</p>
          </div>

          {selectedAnalyses.length >= 2 && (
            <Button onClick={handleRunComparison} disabled={isComparing}>
              {isComparing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Zap className="h-4 w-4 mr-2" />
                  </motion.div>
                  Comparing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Run Comparison
                </>
              )}
            </Button>
          )}
        </div>

        {/* Analysis Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Select Analyses to Compare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Analysis Selector */}
            <div className="flex gap-2">
              <Select value={availableAnalysis} onValueChange={setAvailableAnalysis}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose an analysis to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAnalyses
                    .filter((analysis) => !selectedAnalyses.some((item) => item.id === analysis.id))
                    .map((analysis) => (
                      <SelectItem key={analysis.id} value={analysis.id}>
                        <div className="flex items-center gap-2">
                          <span>{analysis.post?.title || `Analysis ${analysis.id.slice(0, 8)}`}</span>
                          <Badge variant="outline" className="text-xs">
                            {analysis.totalComments} comments
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleAddAnalysis(availableAnalysis)} disabled={!availableAnalysis}>
                Add
              </Button>
            </div>

            {/* Selected Analyses with Drag & Drop */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="selected-analyses">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    <AnimatePresence>
                      {selectedAnalyses.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div ref={provided.innerRef} {...provided.draggableProps} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn("flex items-center gap-3 p-3 border rounded-lg bg-background", snapshot.isDragging && "shadow-lg")}>
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <Grip className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div className={cn("w-3 h-3 rounded-full", item.color)} />

                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.analysis.post?.title || `Analysis ${item.id.slice(0, 8)}`}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {item.analysis.totalComments} comments
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(item.analysis.analyzedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <Button variant="ghost" size="sm" onClick={() => handleRemoveAnalysis(item.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {selectedAnalyses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select at least 2 analyses to start comparing</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {selectedAnalyses.length >= 2 && (
          <div className="space-y-6">
            {/* Performance Overview */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Best Performer</p>
                        <p className="text-lg font-bold">{insights.bestPerforming?.analysisId.slice(0, 8)}</p>
                      </div>
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                        <p className="text-lg font-bold">{insights.averageEngagement.toFixed(1)}%</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                        <p className="text-lg font-bold">{metrics.reduce((sum, m) => sum + (m?.totalComments || 0), 0)}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Analyses</p>
                        <p className="text-lg font-bold">{selectedAnalyses.length}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Side-by-Side Sentiment Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedAnalyses.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", item.color)} />
                        <h4 className="font-medium truncate">{item.analysis.post?.title || `Analysis ${item.id.slice(0, 8)}`}</h4>
                      </div>

                      {item.analysis.sentimentBreakdown && (
                        <div className="space-y-2">
                          <SentimentChart breakdown={item.analysis.sentimentBreakdown} size="sm" />

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-green-600">{(item.analysis.sentimentBreakdown.positive * 100).toFixed(1)}%</div>
                              <div className="text-muted-foreground">Positive</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-600">{(item.analysis.sentimentBreakdown.neutral * 100).toFixed(1)}%</div>
                              <div className="text-muted-foreground">Neutral</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-red-600">{(item.analysis.sentimentBreakdown.negative * 100).toFixed(1)}%</div>
                              <div className="text-muted-foreground">Negative</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics Comparison */}
            {metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Analysis</th>
                          <th className="text-center py-2">Comments</th>
                          <th className="text-center py-2">Engagement Score</th>
                          <th className="text-center py-2">Dominant Sentiment</th>
                          <th className="text-center py-2">Confidence</th>
                          <th className="text-center py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.map((metric) => {
                          const item = selectedAnalyses.find((s) => s.id === metric.analysisId);
                          return (
                            <tr key={metric.analysisId} className="border-b">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", item?.color)} />
                                  <span className="font-medium">{item?.analysis.post?.title || `Analysis ${metric.analysisId.slice(0, 8)}`}</span>
                                </div>
                              </td>
                              <td className="text-center py-3">{metric.totalComments}</td>
                              <td className="text-center py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-medium">{metric.engagementScore.toFixed(1)}</span>
                                  {metric.engagementScore > insights.averageEngagement ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                                </div>
                              </td>
                              <td className="text-center py-3">
                                <Badge variant="outline" className={getSentimentColor(metric.dominantSentiment)}>
                                  {metric.dominantSentiment}
                                </Badge>
                              </td>
                              <td className="text-center py-3">{(metric.confidenceScore * 100).toFixed(1)}%</td>
                              <td className="text-center py-3">{new Date(metric.analyzedAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights and Recommendations */}
            {comparisonResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Insights & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comparisonResult.insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
