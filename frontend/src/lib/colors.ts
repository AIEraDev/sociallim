/**
 * EchoMind Color System
 * Unified color palette inspired by the auth page design
 */

export const colors = {
  // Primary gradient colors
  gradient: {
    purple: "oklch(0.6 0.2 264)",
    pink: "oklch(0.65 0.18 320)",
    cyan: "oklch(0.7 0.15 200)",
  },

  // Dark gradient colors for dark mode
  gradientDark: {
    purple: "oklch(0.7 0.18 264)",
    pink: "oklch(0.75 0.16 320)",
    cyan: "oklch(0.8 0.13 200)",
  },

  // Background gradients
  backgrounds: {
    // Main dark gradient for hero sections
    dark: "linear-gradient(135deg, oklch(0.08 0.015 264) 0%, oklch(0.12 0.025 280) 25%, oklch(0.1 0.02 320) 50%, oklch(0.08 0.015 264) 100%)",

    // Light gradient for sections
    light: "linear-gradient(135deg, oklch(0.98 0.005 264) 0%, oklch(0.96 0.008 264) 100%)",

    // Card gradients
    cardDark: "linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)",
    cardLight: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)",
  },

  // Text gradients
  text: {
    primary: "linear-gradient(135deg, oklch(0.6 0.2 264) 0%, oklch(0.65 0.18 320) 100%)",
    secondary: "linear-gradient(135deg, oklch(0.65 0.18 320) 0%, oklch(0.7 0.15 200) 100%)",
    accent: "linear-gradient(135deg, oklch(0.7 0.15 200) 0%, oklch(0.6 0.2 264) 100%)",
  },

  // Button gradients
  buttons: {
    primary: "linear-gradient(135deg, oklch(0.6 0.2 264) 0%, oklch(0.65 0.18 320) 100%)",
    primaryHover: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.6 0.2 320) 100%)",
    secondary: "linear-gradient(135deg, oklch(0.65 0.18 320) 0%, oklch(0.7 0.15 200) 100%)",
    secondaryHover: "linear-gradient(135deg, oklch(0.6 0.2 320) 0%, oklch(0.65 0.17 200) 100%)",
  },

  // Glass morphism
  glass: {
    light: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      backdrop: "blur(16px) saturate(180%)",
    },
    dark: {
      background: "rgba(0, 0, 0, 0.4)",
      border: "rgba(255, 255, 255, 0.1)",
      backdrop: "blur(16px) saturate(180%)",
    },
    card: {
      light: {
        background: "rgba(255, 255, 255, 0.8)",
        border: "rgba(255, 255, 255, 0.3)",
        backdrop: "blur(20px) saturate(180%)",
      },
      dark: {
        background: "rgba(0, 0, 0, 0.6)",
        border: "rgba(255, 255, 255, 0.15)",
        backdrop: "blur(20px) saturate(180%)",
      },
    },
  },

  // Semantic colors
  semantic: {
    success: "oklch(0.7 0.15 140)",
    warning: "oklch(0.75 0.15 60)",
    error: "oklch(0.65 0.2 15)",
    info: "oklch(0.7 0.15 200)",
  },
} as const;

// CSS custom properties for dynamic theming
export const cssVariables = {
  light: {
    "--gradient-purple": colors.gradient.purple,
    "--gradient-pink": colors.gradient.pink,
    "--gradient-cyan": colors.gradient.cyan,
  },
  dark: {
    "--gradient-purple": colors.gradientDark.purple,
    "--gradient-pink": colors.gradientDark.pink,
    "--gradient-cyan": colors.gradientDark.cyan,
  },
} as const;

// Utility functions for generating color classes
export const getGradientClass = (type: "primary" | "secondary" | "accent") => {
  const gradients = {
    primary: "bg-gradient-primary",
    secondary: "bg-gradient-secondary",
    accent: "bg-gradient-accent",
  };
  return gradients[type];
};

export const getTextGradientClass = (type: "primary" | "secondary" | "accent") => {
  const gradients = {
    primary: "text-gradient-primary",
    secondary: "text-gradient-secondary",
    accent: "text-gradient-accent",
  };
  return gradients[type];
};

export const getGlassClass = (type: "default" | "card" = "default") => {
  return type === "card" ? "glass-card" : "glass";
};
