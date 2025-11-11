"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Target, Clock } from "lucide-react";

const stats = [
  { label: "Creators trust us", value: "5,342", icon: Users },
  { label: "Comments analyzed", value: "2.5M+", icon: MessageSquare },
  { label: "Accuracy rate", value: "95%", icon: Target },
  { label: "Average response time", value: "<10s", icon: Clock },
];

export function StatsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold mb-2 text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
