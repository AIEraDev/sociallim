"use client";

import { motion } from "framer-motion";
import { Youtube, X, Instagram, Smartphone } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

const integrations = [
  { name: "YouTube", icon: Youtube, description: "Comments & community posts", color: "text-red-500" },
  { name: "X", icon: X, description: "Replies & mentions", color: "text-blue-400" },
  { name: "Instagram", icon: Instagram, description: "Comments & DMs", color: "text-pink-500" },
  { name: "TikTok", icon: Smartphone, description: "Video comments", color: "text-purple-500" },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-linear-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">Integrations</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Works with <span className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">everything</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Connect all your social platforms with one-click authorization. We handle the permissions, you get the insights.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {integrations.map((integration, index) => (
            <motion.div key={integration.name} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="group">
              <Card className="glass border-border/50 hover:border-border transition-all duration-300 h-full">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${integration.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <integration.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
