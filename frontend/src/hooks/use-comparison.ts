/**
 * Comparison hooks using TanStack Query
 * Manages multi-analysis comparison functionality
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-client";
import { ComparisonRequest, AnalysisResult } from "@/types";

/**
 * Hook for comparing multiple analyses
 */
export function useComparison() {
  const queryClient = useQueryClient();

  const compareMutation = useMutation({
    mutationFn: async (request: ComparisonRequest) => {
      const response = await apiClient.compareAnalyses(request);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to compare analyses");
      }
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Cache the comparison result
      queryClient.setQueryData(queryKeys.analysis.comparison(variables.analysisIds), data);
    },
  });

  return {
    compareAnalyses: compareMutation.mutate,
    isComparing: compareMutation.isPending,
    comparisonError: compareMutation.error?.message || null,
    comparisonResult: compareMutation.data,
  };
}

/**
 * Hook for fetching cached comparison results
 */
export function useComparisonResult(analysisIds: string[]) {
  const {
    data: comparison,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.analysis.comparison(analysisIds),
    queryFn: async () => {
      const response = await apiClient.compareAnalyses({ analysisIds });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch comparison");
      }
      return response.data!;
    },
    enabled: analysisIds.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    comparison,
    isLoading,
    error: error?.message || null,
  };
}

/**
 * Hook for managing comparison selection state
 */
export function useComparisonSelection() {
  //   const queryClient = useQueryClient();

  // Get all available analyses for comparison
  const { data: availableAnalyses = [] } = useQuery({
    queryKey: queryKeys.analysis.history,
    queryFn: async () => {
      const response = await apiClient.getAnalysisHistory();
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch analysis history");
      }
      return response.data!;
    },
  });

  return {
    availableAnalyses,
  };
}

/**
 * Hook for analysis performance metrics
 */
export function useAnalysisMetrics(analyses: AnalysisResult[]) {
  const metrics = analyses
    .map((analysis) => {
      const breakdown = analysis.sentimentBreakdown;
      if (!breakdown) return null;

      const total = breakdown.positive + breakdown.negative + breakdown.neutral;
      const positiveRatio = breakdown.positive / total;
      const negativeRatio = breakdown.negative / total;
      const neutralRatio = breakdown.neutral / total;

      // Calculate engagement score (higher positive sentiment = better engagement)
      const engagementScore = positiveRatio * 100 - negativeRatio * 50;

      return {
        analysisId: analysis.id,
        totalComments: analysis.totalComments,
        filteredComments: analysis.filteredComments,
        positiveRatio,
        negativeRatio,
        neutralRatio,
        engagementScore,
        confidenceScore: breakdown.confidenceScore,
        dominantSentiment: positiveRatio > negativeRatio && positiveRatio > neutralRatio ? "positive" : negativeRatio > positiveRatio && negativeRatio > neutralRatio ? "negative" : "neutral",
        topThemes: analysis.themes?.slice(0, 3) || [],
        topEmotions: analysis.emotions?.slice(0, 3) || [],
        analyzedAt: analysis.analyzedAt,
      };
    })
    .filter(Boolean);

  // Calculate comparative insights
  const filteredMetrics = metrics.filter((m): m is NonNullable<typeof m> => m !== null);
  const insights = {
    bestPerforming: filteredMetrics.length > 0 ? filteredMetrics.reduce((best, current) => (current.engagementScore > best.engagementScore ? current : best)) : null,
    averageEngagement: filteredMetrics.length > 0 ? filteredMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / filteredMetrics.length : 0,
    trends: [] as string[], // This would be calculated based on temporal data
    recommendations: [] as string[], // This would be generated based on patterns
  };

  return {
    metrics: filteredMetrics,
    insights,
  };
}
