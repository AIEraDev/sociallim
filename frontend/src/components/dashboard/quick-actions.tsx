"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Users, BarChart3, TrendingUp } from "lucide-react";

export function QuickActions() {
  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-[var(--vr-muted)]">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start btn-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Start New Analysis
          </Button>
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            Manage Platforms
          </Button>
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="glass-card border-white/20 bg-gradient-to-br from-[var(--vr-accent-1)]/10 to-[var(--vr-accent-2)]/10">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-2">Upgrade to Pro</h3>
            <p className="text-sm text-[var(--vr-muted)] mb-4">Get unlimited analyses, advanced insights, and priority support.</p>
            <Button size="sm" className="btn-gradient-primary">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
