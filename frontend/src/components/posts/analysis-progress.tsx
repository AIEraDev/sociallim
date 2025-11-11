/**
 * Analysis Progress Component
 * Beautiful progress indicators with real-time analysis updates
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, BarChart3, Brain, MessageSquare, Sparkles, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  className?: string;
}

// Mock active jobs for demonstration - in real app this would come from global state
type JobStatus = "pending" | "processing" | "completed" | "failed";

interface MockJob {
  id: string;
  postTitle: string;
  platform: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
}

const mockActiveJobs: MockJob[] = [
  {
    id: "job-1",
    postTitle: "My Latest YouTube Video About React",
    platform: "YOUTUBE",
    status: "processing",
    progress: 65,
    currentStep: "Analyzing sentiment patterns...",
  },
  {
    id: "job-2",
    postTitle: "Instagram Post About Travel",
    platform: "INSTAGRAM",
    status: "pending",
    progress: 0,
    currentStep: "Waiting to start...",
  },
];

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  processing: {
    icon: Brain,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
  },
};

const analysisSteps = [
  { icon: MessageSquare, label: "Fetching comments" },
  { icon: Brain, label: "Analyzing sentiment" },
  { icon: Sparkles, label: "Extracting themes" },
  { icon: BarChart3, label: "Generating summary" },
];

export function AnalysisProgress({ className }: AnalysisProgressProps) {
  const [activeJobs, setActiveJobs] = useState<MockJob[]>(mockActiveJobs);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());

  // Filter out dismissed jobs
  const visibleJobs = activeJobs.filter((job) => !dismissedJobs.has(job.id));

  const handleDismissJob = (jobId: string) => {
    setDismissedJobs((prev) => new Set([...prev, jobId]));
  };

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveJobs((prev) =>
        prev.map((job) => {
          if (job.status === "processing" && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 15, 100);
            const stepIndex = Math.floor((newProgress / 100) * analysisSteps.length);
            const currentStep = stepIndex < analysisSteps.length ? analysisSteps[stepIndex].label + "..." : "Finalizing results...";

            return {
              ...job,
              progress: newProgress,
              currentStep,
              status: newProgress >= 100 ? ("completed" as JobStatus) : job.status,
            };
          }
          return job;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (visibleJobs.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatePresence mode="popLayout">
        {visibleJobs.map((job) => {
          const config = statusConfig[job.status];
          const StatusIcon = config.icon;

          return (
            <motion.div key={job.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <Card className={cn("border-l-4 transition-all duration-300", config.borderColor, config.bgColor)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", config.bgColor)}>{job.status === "processing" ? <LoadingSpinner size="sm" className={config.color} /> : <StatusIcon className={cn("h-4 w-4", config.color)} />}</div>
                      <div>
                        <CardTitle className="text-sm font-medium">Analyzing: {job.postTitle}</CardTitle>
                        <p className={cn("text-xs", config.color)}>{job.currentStep}</p>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon-sm" onClick={() => handleDismissJob(job.id)} className="opacity-60 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {job.status === "processing" && (
                    <div className="space-y-3">
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{Math.round(job.progress)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))} initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                        </div>
                      </div>

                      {/* Analysis steps */}
                      <div className="flex items-center justify-between">
                        {analysisSteps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isActive = index <= Math.floor((job.progress / 100) * analysisSteps.length);
                          const isCurrent = index === Math.floor((job.progress / 100) * analysisSteps.length);

                          return (
                            <div key={step.label} className="flex flex-col items-center gap-1">
                              <div className={cn("p-1.5 rounded-full border-2 transition-all duration-300", isActive ? cn(config.color, config.borderColor.replace("border-", "border-"), config.bgColor) : "border-muted bg-muted text-muted-foreground")}>{isCurrent && job.status === "processing" ? <LoadingSpinner size="sm" /> : <StepIcon className="h-3 w-3" />}</div>
                              <span className={cn("text-xs text-center max-w-16", isActive ? config.color : "text-muted-foreground")}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 dark:text-green-300">Analysis completed successfully!</span>
                    </div>
                  )}

                  {job.status === "failed" && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-700 dark:text-red-300">Analysis failed. Please try again.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
