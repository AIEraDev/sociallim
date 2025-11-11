/**
 * Analysis Results Page
 *
 * Dynamic page for displaying individual analysis results with the
 * comprehensive dashboard and all visualization components
 */

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalysisDashboard } from "@/components/analysis";
import { useAnalysisResult } from "@/hooks/use-analysis";

export default function AnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const { result, isLoading, error } = useAnalysisResult(analysisId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Loading Analysis Results</h2>
                <p className="text-muted-foreground">Please wait while we fetch your analysis data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                  <div>
                    <h2 className="text-lg font-semibold">Error Loading Analysis</h2>
                    <p className="text-muted-foreground mt-2">{error}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // No result found
  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold">Analysis Not Found</h2>
                    <p className="text-muted-foreground mt-2">The requested analysis could not be found or may have been deleted.</p>
                  </div>
                  <Button variant="outline" onClick={() => router.push("/posts")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Posts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with navigation */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {result.post && (
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold truncate">Analysis: {result.post.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {result.post.platform} • {new Date(result.post.publishedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Dashboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <AnalysisDashboard result={result} />
        </motion.div>
      </div>
    </div>
  );
}
