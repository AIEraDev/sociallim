"use client";

import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

import { Shield, Award, Lock } from "lucide-react";

export function SecurityPrivacy() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <Badge className="mb-4 bg-linear-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-green-500/30">Security & Privacy</Badge>
          <h2 className="text-4xl font-bold mb-6">
            Your data is <span className="bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">safe</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12">We read comments — not DMs. Bank-level encryption, GDPR compliance, and you control your data.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "End-to-end encryption", desc: "All data encrypted in transit and at rest" },
              { icon: Lock, title: "GDPR compliant", desc: "Full compliance with privacy regulations" },
              { icon: Award, title: "SOC 2 certified", desc: "Enterprise-grade security standards" },
            ].map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="text-center">
                <div className="w-16 h-16 bg-linear-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
