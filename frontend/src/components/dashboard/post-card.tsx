"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, CheckCircle2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  id: number;
  title: string;
  platform: string;
  comments: number;
  sentiment: { positive: number; neutral: number; negative: number };
  status: "completed" | "processing" | "failed";
  date: string;
  delay?: number;
  onViewDetails?: (id: number) => void;
  onRerun?: (id: number) => void;
  onMarkResolved?: (id: number) => void;
}

export function PostCard({ id, title, platform, comments, sentiment, status, date, delay = 0, onViewDetails, onRerun, onMarkResolved }: PostCardProps) {
  const statusColors = {
    completed: "bg-[var(--vr-success)]/20 text-[var(--vr-success)]",
    processing: "bg-[var(--vr-accent-1)]/20 text-[var(--vr-accent-1)]",
    failed: "bg-[var(--vr-danger)]/20 text-[var(--vr-danger)]",
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay }} className="glass-card border-white/20 rounded-xl p-4 card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-2 truncate">{title}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs bg-white/5 border-white/10 text-[var(--vr-muted)]">
              {platform}
            </Badge>
            <span className="text-sm text-[var(--vr-muted)]">{comments.toLocaleString()} comments</span>
            <span className="text-sm text-[var(--vr-muted)]">•</span>
            <span className="text-sm text-[var(--vr-muted)]">{date}</span>
          </div>
        </div>
        <Badge className={cn("text-xs", statusColors[status])}>{status}</Badge>
      </div>

      {/* Sentiment Breakdown */}
      {status === "completed" && (
        <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-white/10">
          <SentimentBar label="Positive" value={sentiment.positive} color="var(--vr-success)" />
          <SentimentBar label="Neutral" value={sentiment.neutral} color="var(--vr-neutral)" />
          <SentimentBar label="Negative" value={sentiment.negative} color="var(--vr-danger)" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        {status === "completed" && (
          <>
            <Button variant="ghost" size="sm" className="flex-1 text-xs text-[var(--vr-muted)] hover:text-white hover:bg-white/5" onClick={() => onViewDetails?.(id)}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View Details
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-[var(--vr-muted)] hover:text-white hover:bg-white/5" onClick={() => onRerun?.(id)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Re-run
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-[var(--vr-muted)] hover:text-white hover:bg-white/5" onClick={() => onMarkResolved?.(id)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Resolved
            </Button>
          </>
        )}
        {status === "processing" && (
          <div className="flex items-center gap-2 text-sm text-[var(--vr-accent-1)]">
            <div className="w-2 h-2 rounded-full bg-[var(--vr-accent-1)] animate-pulse" />
            Processing...
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold mb-1" style={{ color }}>
        {value}%
      </div>
      <div className="text-xs text-[var(--vr-muted)] mb-2">{label}</div>
      {/* Micro sparkline */}
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}
