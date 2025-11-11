/**
 * Export hooks using TanStack Query
 * Manages analysis export functionality with progress tracking
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ExportRequest } from "@/types";

/**
 * Hook for exporting analysis results with progress tracking
 */
export function useExport() {
  const exportMutation = useMutation({
    mutationFn: async (request: ExportRequest) => {
      const response = await apiClient.exportAnalysis(request);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to export analysis");
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Auto-download the file
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = `analysis-export.${data.downloadUrl.split(".").pop()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  });

  return {
    exportAnalysis: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error?.message || null,
    exportSuccess: exportMutation.isSuccess,
  };
}

/**
 * Hook for generating shareable analysis links
 */
export function useShareableLink(analysisId: string) {
  const {
    data: shareData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["analysis", "share", analysisId],
    queryFn: async () => {
      // Generate shareable link (this would be implemented in the backend)
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/analysis/shared/${analysisId}`;

      return {
        url: shareUrl,
        previewCard: {
          title: "Analysis Results",
          description: "View detailed sentiment analysis results",
          image: `${baseUrl}/api/analysis/${analysisId}/preview-image`,
        },
      };
    },
    enabled: !!analysisId,
  });

  const copyToClipboard = async () => {
    if (shareData?.url) {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  return {
    shareData,
    isLoading,
    error: error?.message || null,
    copyToClipboard,
  };
}
