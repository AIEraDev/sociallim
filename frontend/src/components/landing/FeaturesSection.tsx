"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, Target, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const keyFeatures = [
  {
    icon: Brain,
    title: "Know what your audience says — in 10s",
    description: "AI instantly analyzes thousands of comments across all platforms.",
  },
  {
    icon: TrendingUp,
    title: "Spot trends before they explode",
    description: "Real-time sentiment tracking catches viral moments early.",
  },
  {
    icon: Target,
    title: "Turn feedback into action",
    description: "Get specific recommendations to improve engagement.",
  },
  {
    icon: Shield,
    title: "Your data stays private",
    description: "We read comments — not DMs. You're in control.",
  },
  {
    icon: Zap,
    title: "Works with everything you use",
    description: "YouTube, Instagram, Twitter, TikTok — all in one dashboard.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-muted/50 text-foreground border-border backdrop-blur-sm">Key Benefits</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            What&apos;s in it for <span className="text-gradient-accent">you?</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {keyFeatures.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="group">
              <Card className="glass-card border-border hover:border-border/80 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
