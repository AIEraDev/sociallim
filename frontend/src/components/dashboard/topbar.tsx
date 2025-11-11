"use client";

import { Search, Calendar, Filter, Plus, Bell, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageTitle = pathname === "/dashboard" ? "Dashboard" : pathname === "/analyses" ? "Analyses" : pathname === "/analytics" ? "Analytics" : pathname === "/platforms" ? "Platforms" : pathname === "/settings" ? "Settings" : "Dashboard";

  return (
    <header className="glass-card border-b border-border sticky top-0 z-30">
      <div className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Page Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-xs sm:text-sm text-[var(--vr-muted)] mt-0.5 hidden sm:block">Know what your audience really means — instantly.</p>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vr-muted)]" />
              <Input type="search" placeholder="Search analyses, posts, comments..." className="w-full pl-10 pr-4 bg-background border-border text-foreground placeholder:text-[var(--vr-muted)] focus:border-[var(--vr-accent-1)] focus:ring-[var(--vr-accent-1)]" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Date Range */}
            <Button variant="outline" size="sm" className="hidden sm:flex border-border bg-secondary text-foreground hover:bg-secondary/80">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Last 30 days</span>
              <span className="lg:hidden">30d</span>
            </Button>

            {/* Filter */}
            <Button variant="outline" size="sm" className="hidden sm:flex border-border bg-secondary text-foreground hover:bg-secondary/80" aria-label="Filter">
              <Filter className="w-4 h-4" />
            </Button>

            {/* New Analysis CTA */}
            <Button size="sm" className="btn-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-[var(--vr-muted)] hover:text-foreground hover:bg-secondary" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Button>

            {/* Theme Toggle */}
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-[var(--vr-muted)] hover:text-foreground hover:bg-secondary dark:hover:bg-white/5" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

            {/* User Menu */}
            <Button variant="ghost" size="icon" className="text-[var(--vr-muted)] hover:text-foreground hover:bg-secondary dark:hover:bg-white/5" aria-label="User menu">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
