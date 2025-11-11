import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gradientButtonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
  variants: {
    variant: {
      primary: "btn-gradient-primary text-white shadow hover:shadow-lg",
      secondary: "bg-gradient-secondary text-white shadow hover:shadow-lg",
      accent: "bg-gradient-accent text-white shadow hover:shadow-lg",
      outline: "border border-white/20 bg-transparent text-white hover:bg-white/10",
      ghost: "text-white hover:bg-white/10",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      xl: "h-12 rounded-lg px-10 text-base",
      icon: "h-9 w-9",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(gradientButtonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };
