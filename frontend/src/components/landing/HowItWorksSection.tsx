"use client";

import { motion } from "framer-motion";
import { Globe, Eye, Brain, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const howItWorksSteps = [
  {
    step: 1,
    title: "Connect",
    description: "Link your social accounts with one-click authorization",
    icon: Globe,
  },
  {
    step: 2,
    title: "Scan",
    description: "Our AI analyzes comments in real-time across all platforms",
    icon: Eye,
  },
  {
    step: 3,
    title: "Understand",
    description: "Get instant insights with sentiment breakdowns and trends",
    icon: Brain,
  },
  {
    step: 4,
    title: "Reply",
    description: "Use AI-powered suggestions to engage meaningfully",
    icon: MessageSquare,
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-muted/50 text-foreground border-border backdrop-blur-sm">How it works</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Simple 4-step <span className="bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Workflow</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorksSteps.map((step, index) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="text-center relative">
              {/* Connection Line */}
              {index < howItWorksSteps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full">
                  <div className="w-full h-0.5 bg-linear-to-r from-transparent via-purple-500/60 to-transparent dark:via-purple-400/70" />
                </div>
              )}

              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg">
                  <step.icon className="w-10 h-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-purple-500 dark:border-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-foreground shadow-md">{step.step}</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
