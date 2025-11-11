"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplyAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialComment?: string;
}

const toneOptions = [
  { id: "professional", label: "Professional", active: true },
  { id: "friendly", label: "Friendly", active: false },
  { id: "casual", label: "Casual", active: false },
  { id: "empathetic", label: "Empathetic", active: false },
];

const variations = ["Thank you for your feedback! We're always working to improve and appreciate you taking the time to share your thoughts.", "We really appreciate your input! Your feedback helps us make our product better for everyone.", "Thanks for sharing! We're listening and will take your suggestions into consideration."];

export function ReplyAssistantModal({ open, onOpenChange, initialComment }: ReplyAssistantModalProps) {
  const [selectedTone, setSelectedTone] = useState("professional");
  const [reply, setReply] = useState(variations[0]);
  const [selectedVariation, setSelectedVariation] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-card border-white/20 bg-[var(--vr-bg)]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--vr-accent-1)]" />
            Reply Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Comment */}
          {initialComment && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-[var(--vr-muted)] mb-2">Original comment:</p>
              <p className="text-white">{initialComment}</p>
            </div>
          )}

          {/* Tone Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">Tone</label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((tone) => (
                <button key={tone.id} onClick={() => setSelectedTone(tone.id)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", selectedTone === tone.id ? "bg-gradient-primary text-white" : "bg-white/5 text-[var(--vr-muted)] hover:bg-white/10 hover:text-white border border-white/10")}>
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply Textarea */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">Your Reply</label>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-[var(--vr-muted)] focus:border-[var(--vr-accent-1)] focus:ring-[var(--vr-accent-1)]" placeholder="Type or edit your reply here..." />
          </div>

          {/* Variations */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">Variations</label>
            <div className="space-y-2">
              {variations.map((variation, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setReply(variation);
                    setSelectedVariation(index);
                  }}
                  className={cn("w-full text-left p-3 rounded-lg text-sm transition-all", selectedVariation === index ? "bg-white/10 border-2 border-[var(--vr-accent-1)] text-white" : "bg-white/5 border border-white/10 text-[var(--vr-muted)] hover:bg-white/10 hover:text-white")}
                >
                  {variation}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText(reply);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button className="flex-1 btn-gradient-primary" onClick={() => onOpenChange(false)}>
              <Send className="w-4 h-4 mr-2" />
              Send Reply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
