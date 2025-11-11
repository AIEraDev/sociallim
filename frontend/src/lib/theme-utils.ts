import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * EchoMind Theme Utilities
 * Helper functions for consistent theming across the app
 */

// Brand colors and gradients
export const theme = {
  // Background classes
  backgrounds: {
    dark: "bg-gradient-dark",
    surface: "bg-gradient-surface",
    primary: "bg-gradient-primary",
    secondary: "bg-gradient-secondary",
    accent: "bg-gradient-accent",
  },

  // Text gradient classes
  text: {
    primary: "text-gradient-primary",
    secondary: "text-gradient-secondary",
    accent: "text-gradient-accent",
    white: "text-white",
    gray: "text-gray-300",
  },

  // Glass morphism classes
  glass: {
    default: "glass border-white/20",
    card: "glass-card border-white/20",
    subtle: "glass border-white/10",
    strong: "glass-card border-white/30",
  },

  // Button classes
  buttons: {
    primary: "btn-gradient-primary",
    outline: "border-white/20 bg-transparent text-white hover:bg-white/10",
    ghost: "text-white hover:bg-white/10",
  },

  // Icon container classes
  icons: {
    primary: "bg-gradient-primary rounded-lg flex items-center justify-center",
    secondary: "bg-gradient-secondary rounded-lg flex items-center justify-center",
    accent: "bg-gradient-accent rounded-lg flex items-center justify-center",
  },
} as const;

/**
 * Get themed classes for common UI patterns
 */
export const getThemedClasses = {
  // Hero section
  hero: () => cn(theme.backgrounds.dark, "min-h-screen flex items-center justify-center p-4"),

  // Navigation bar
  nav: () => cn(theme.glass.card, "border-b border-white/10 sticky top-0 z-50"),

  // Card component
  card: (variant: "default" | "glass" | "subtle" = "default") => {
    const variants = {
      default: "bg-white/5 border-white/20",
      glass: theme.glass.card,
      subtle: theme.glass.subtle,
    };
    return cn(variants[variant], "rounded-lg shadow-lg");
  },

  // Brand logo
  logo: (size: "sm" | "md" | "lg" = "md") => {
    const sizes = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };
    return cn(theme.icons.primary, sizes[size]);
  },

  // Section headers
  sectionHeader: () => cn("text-center mb-16"),

  // Feature cards
  featureCard: () => cn(theme.glass.card, "p-6 hover:-translate-y-1 transition-all duration-300"),
} as const;

/**
 * Animation classes for consistent motion
 */
export const animations = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  scaleIn: "animate-scale-in",
  blob: "animate-blob",
  float: "floating-element",
  floatDelayed: "floating-element-delayed",
} as const;

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
} as const;

/**
 * Common spacing utilities
 */
export const spacing = {
  section: "py-20 px-4 sm:px-6 lg:px-8",
  container: "max-w-7xl mx-auto",
  cardPadding: "p-6",
  buttonPadding: "px-6 py-2",
} as const;
