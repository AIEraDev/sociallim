"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp } from "lucide-react";

/**
 * Color Showcase Component
 * Demonstrates the unified EchoMind color system
 */
export function ColorShowcase() {
  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-primary">EchoMind</h1>
          </div>
          <p className="text-gray-300 text-lg">Unified Color System Showcase</p>
        </div>

        {/* Buttons */}
        <GlassCard variant="card" className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Gradient Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <GradientButton variant="primary">Primary Button</GradientButton>
            <GradientButton variant="secondary">Secondary Button</GradientButton>
            <GradientButton variant="accent">Accent Button</GradientButton>
            <GradientButton variant="outline">Outline Button</GradientButton>
            <GradientButton variant="ghost">Ghost Button</GradientButton>
          </div>
        </GlassCard>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard variant="default" hover="lift" className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Glass Card Default</h3>
            </div>
            <p className="text-gray-300">This is a default glass card with lift hover effect.</p>
          </GlassCard>

          <GlassCard variant="card" hover="glow" className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Glass Card Enhanced</h3>
            </div>
            <p className="text-gray-300">This is an enhanced glass card with glow hover effect.</p>
          </GlassCard>
        </div>

        {/* Text Gradients */}
        <GlassCard variant="subtle" className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Text Gradients</h2>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gradient-primary">Primary Text Gradient</h3>
            <h3 className="text-2xl font-bold text-gradient-secondary">Secondary Text Gradient</h3>
            <h3 className="text-2xl font-bold text-gradient-accent">Accent Text Gradient</h3>
          </div>
        </GlassCard>

        {/* Badges */}
        <GlassCard variant="strong" className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Badges & Status</h2>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-white/10 text-white border-white/20">Default Badge</Badge>
            <Badge className="bg-gradient-primary text-white border-none">Gradient Badge</Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>
          </div>
        </GlassCard>

        {/* Usage Guide */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">CSS Classes:</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">bg-gradient-primary</code> - Purple to pink gradient
                </li>
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">bg-gradient-secondary</code> - Pink to cyan gradient
                </li>
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">text-gradient-primary</code> - Primary text gradient
                </li>
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">glass</code> - Basic glass morphism
                </li>
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">glass-card</code> - Enhanced glass card
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Components:</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">&lt;GradientButton&gt;</code> - Consistent gradient buttons
                </li>
                <li>
                  <code className="bg-white/10 px-2 py-1 rounded">&lt;GlassCard&gt;</code> - Glass morphism cards
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
