/**
 * Analysis hooks using TanStack Query
 * Manages comment analysis jobs and results
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, handleQueryError } from "@/lib/query-client";

/**
 * Hook for starting and managing analysis jobs
 */
export function useAnalysis() {
  const queryClient = useQueryClient();

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiClient.startAnalysis(postId);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to start analysis");
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Invalidate analysis history to show new job
      queryClient.invalidateQueries({ queryKey: queryKeys.analysis.history });

      // Start polling for job status
      queryClient.invalidateQueries({ queryKey: queryKeys.analysis.status(data.id) });
    },
    onError: (error) => {
      console.error("Analysis start error:", error);
    },
  });

  return {
    startAnalysis: startAnalysisMutation.mutate,
    isStarting: startAnalysisMutation.isPending,
    startError: startAnalysisMutation.error ? handleQueryError(startAnalysisMutation.error) : null,
  };
}

/**
 * Hook for tracking analysis job status with real-time updates
 */
export function useAnalysisStatus(jobId: string | null) {
  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.analysis.status(jobId!),
    queryFn: async () => {
      const response = await apiClient.getAnalysisStatus(jobId!);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch analysis status");
      }
      return response.data!;
    },
    enabled: !!jobId,
    // Poll every 2 seconds while job is running
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "completed" || data.status === "failed") {
        return false;
      }
      return 2000;
    },
    // Keep polling even when window is not focused
    refetchIntervalInBackground: true,
  });

  return {
    job,
    isLoading,
    error: error ? handleQueryError(error) : null,
    isCompleted: job?.status === "completed",
    isFailed: job?.status === "failed",
    isProcessing: job?.status === "processing" || job?.status === "pending",
  };
}

/**
 * Hook for fetching analysis results
 */
export function useAnalysisResult(analysisId: string | null) {
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.analysis.result(analysisId!),
    queryFn: async () => {
      const response = await apiClient.getAnalysisResult(analysisId!);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch analysis result");
      }
      return response.data!;
    },
    enabled: !!analysisId,
  });

  return {
    result,
    isLoading,
    error: error ? handleQueryError(error) : null,
    refetch,
  };
}

/**
 * Hook for fetching analysis history
 */
export function useAnalysisHistory() {
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
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
    history,
    isLoading,
    error: error ? handleQueryError(error) : null,
    refetch,
  };
}
