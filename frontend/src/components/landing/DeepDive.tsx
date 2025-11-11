"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "../ui/badge";
import { CheckCircle } from "lucide-react";

// Generate stable chart data outside component to avoid React purity issues
const chartData = Array.from({ length: 12 }, () => Math.random() * 80 + 20);

export function DeepDive() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -100]);

  return (
    <section id="analytics" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <Badge className="mb-4 bg-linear-to-r from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">Emotion & Sentiment Analysis</Badge>
            <h2 className="text-4xl font-bold mb-6">
              Understand the <span className="bg-linear-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">why</span> behind reactions
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Our AI doesn&apos;t just detect positive or negative — it understands context, sarcasm, cultural nuances, and emotional intensity.</p>
            <ul className="space-y-4">
              {["Detects 8 core emotions with 95% accuracy", "Understands sarcasm and cultural context", "Tracks emotional intensity and urgency", "Identifies trending topics and viral moments"].map((item, index) => (
                <motion.li key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} style={{ y: y1 }} className="relative">
            <div className="glass rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Live Sentiment Analysis</h3>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
              </div>

              {/* Mock Chart */}
              <div className="h-48 flex items-end justify-between space-x-2 mb-6">
                {chartData.map((height, i) => (
                  <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${height}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} viewport={{ once: true }} className="bg-linear-to-t from-cyan-500 to-blue-500 rounded-t-sm flex-1 min-h-[20%]" />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">+15%</div>
                  <div className="text-sm text-muted-foreground">Positive Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">2.3K</div>
                  <div className="text-sm text-muted-foreground">Comments Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">95%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
