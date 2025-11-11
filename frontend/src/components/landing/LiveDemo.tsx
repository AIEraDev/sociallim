"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LiveDemo() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <Badge className="mb-4 bg-linear-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-green-500/30">Try it now</Badge>
          <h2 className="text-4xl font-bold mb-6">See it in action</h2>
          <p className="text-xl text-muted-foreground mb-8">Paste any social media post URL and watch our AI analyze the sentiment in real-time.</p>

          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <input type="text" placeholder="Paste a YouTube, Instagram, or Twitter URL..." className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-purple-500 focus:outline-none transition-colors" />
              </div>
              <Button className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6">Analyze</Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center justify-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>No signup required • We don&apos;t post for you • GDPR safe</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
