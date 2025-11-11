import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva("rounded-lg shadow-lg transition-all duration-300", {
  variants: {
    variant: {
      default: "glass border-white/20",
      card: "glass-card border-white/20",
      subtle: "backdrop-blur-sm bg-white/5 border-white/10",
      strong: "backdrop-blur-xl bg-white/20 border-white/30",
    },
    hover: {
      none: "",
      lift: "hover:-translate-y-1 hover:shadow-xl",
      glow: "hover:shadow-2xl hover:shadow-purple-500/20",
      scale: "hover:scale-105",
    },
  },
  defaultVariants: {
    variant: "default",
    hover: "none",
  },
});

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({ className, variant, hover, ...props }, ref) => {
  return <div className={cn(glassCardVariants({ variant, hover, className }))} ref={ref} {...props} />;
});
GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
