"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

const testimonials = [
  {
    quote: "EchoMind helped us increase engagement by 40% in just 2 months. The sentiment insights are game-changing.",
    author: "Sarah Chen",
    role: "Content Creator",
    followers: "2.3M followers",
    avatar: "SC",
  },
  {
    quote: "Finally, a tool that actually understands context. The AI suggestions for replies are spot-on.",
    author: "Marcus Rodriguez",
    role: "Brand Manager",
    company: "TechFlow",
    avatar: "MR",
  },
  {
    quote: "We caught a potential PR crisis before it exploded. EchoMind's alerts saved our campaign.",
    author: "Lisa Park",
    role: "Social Media Director",
    company: "GrowthCorp",
    avatar: "LP",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-linear-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">Social Proof</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Loved by <span className="bg-linear-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">creators</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div key={testimonial.author} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
              <Card className="glass border-border/50 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-6 italic">&apos;{testimonial.quote}&apos;</blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company && ` • ${testimonial.company}`}
                        {testimonial.followers && ` • ${testimonial.followers}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
