"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  variant?: "default" | "compact";
}

export function ThemeSwitcher({ className, variant = "default" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "system", icon: Monitor, label: "System" },
  ];

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-1 p-1 bg-muted rounded-lg", className)}>
        {themes.map(({ name, icon: Icon, label }) => (
          <Button key={name} variant="ghost" size="sm" onClick={() => setTheme(name)} className={cn("h-8 w-8 p-0 transition-colors", theme === name ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")} title={label}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm font-medium text-muted-foreground">Theme:</span>
      <div className="flex items-center space-x-1 p-1 bg-muted rounded-lg">
        {themes.map(({ name, icon: Icon, label }) => (
          <Button key={name} variant="ghost" size="sm" onClick={() => setTheme(name)} className={cn("h-8 px-3 text-xs transition-colors", theme === name ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
