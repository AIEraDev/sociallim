"use client";

import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

const faqs = [
  {
    question: "How accurate is the sentiment analysis?",
    answer: "Our AI achieves 95% accuracy by understanding context, sarcasm, and cultural nuances. We continuously improve with user feedback.",
  },
  {
    question: "Do you store my social media data?",
    answer: "We only analyze comments temporarily and don't store personal data. You can delete all data anytime from your dashboard.",
  },
  {
    question: "Which platforms do you support?",
    answer: "Currently YouTube, Instagram, Twitter, and TikTok. We're adding LinkedIn, Facebook, and Reddit soon.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel anytime with one click. No contracts, no hidden fees. Your data is exported automatically.",
  },
];

export function FaqSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">FAQ</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Common <span className="bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">questions</span>
          </h2>
        </motion.div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
              <Card className="glass border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
