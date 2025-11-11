/**
 * Analysis History Page
 *
 * Comprehensive history view with timeline, search, and filtering
 */

"use client";

import { useRouter } from "next/navigation";
import { AnalysisHistory } from "@/components/analysis";
import { AnalysisResult } from "@/types";

export default function AnalysisHistoryPage() {
  const router = useRouter();

  const handleSelectAnalysis = (analysis: AnalysisResult) => {
    router.push(`/analysis/${analysis.id}`);
  };

  const handleCompareAnalyses = (analyses: AnalysisResult[]) => {
    const ids = analyses.map((a) => a.id).join(",");
    router.push(`/analysis/compare?ids=${ids}`);
  };

  return (
    <div className="container mx-auto py-8">
      <AnalysisHistory onSelectAnalysis={handleSelectAnalysis} onCompareAnalyses={handleCompareAnalyses} />
    </div>
  );
}
