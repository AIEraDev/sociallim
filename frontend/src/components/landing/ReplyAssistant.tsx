"use client";

import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";

export function ReplyAssistant() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="order-2 lg:order-1">
            <div className="glass-card border-border rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-foreground">AI Reply Assistant</h3>
              <div className="space-y-4">
                {/* Comment Example */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">JD</div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">@john_doe</p>
                      <p className="text-sm text-foreground">This feature doesn&apos;t work at all! Waste of time.</p>
                      <Badge variant="destructive" className="mt-2 text-xs">
                        Negative • Urgent
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* AI Reply Suggestion */}
                <div className="border-l-4 border-purple-500 dark:border-purple-400 pl-4 bg-muted/30 rounded-r-lg py-3">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">AI Suggested Reply:</p>
                  <p className="text-sm text-muted-foreground mb-3">&quot;Hi John! I&quot;m sorry to hear you&quot;re having trouble. Let me help you get this sorted out right away. Could you DM me the specific issue you&quot;re facing? We&quot;ll make sure it works perfectly for you. 🛠️&quot;</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" className="btn-gradient-primary">
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <Badge className="mb-4 bg-muted/50 text-foreground border-border backdrop-blur-sm">Reply Assistant & Automation</Badge>
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Never miss a <span className="text-gradient-primary">conversation</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Get AI-powered reply suggestions that match your brand voice. Automate responses to common questions while staying authentic.</p>
            <ul className="space-y-4">
              {["Smart reply suggestions based on sentiment", "Brand voice training for consistent tone", "Auto-escalation for urgent negative feedback", "Workflow automation for common scenarios"].map((item, index) => (
                <motion.li key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
