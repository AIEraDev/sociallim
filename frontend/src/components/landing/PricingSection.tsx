"use client";

import { motion } from "framer-motion";
import { CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: ["100 comments/month", "Basic sentiment analysis", "1 platform connection", "Email support"],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Creator",
    price: "$29",
    period: "month",
    description: "For growing creators",
    features: ["10K comments/month", "Advanced AI analysis", "All platform integrations", "Real-time alerts", "Priority support"],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "month",
    description: "For teams and agencies",
    features: ["Unlimited comments", "Team collaboration", "Custom integrations", "White-label reports", "Dedicated support"],
    cta: "Contact sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-4 bg-muted/50 text-foreground border-border backdrop-blur-sm">Pricing</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Simple, <span className="bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">transparent</span> pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Start free, upgrade when you need more. No hidden fees, cancel anytime.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div key={tier.name} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className={`relative ${tier.popular ? "scale-105" : ""}`}>
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-white">Most Popular</Badge>
                </div>
              )}
              <Card className={`glass-card border-border h-full ${tier.popular ? "border-purple-500/50 shadow-lg shadow-purple-500/20" : ""}`}>
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                      <span className="text-muted-foreground">/{tier.period}</span>
                    </div>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className={`w-full ${tier.popular ? "btn-gradient-primary" : ""}`} variant={tier.popular ? "default" : "outline"}>
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} className="text-center mt-12">
          <Link href="/pricing">
            <Button variant="outline" className="group">
              See full pricing details
              <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
