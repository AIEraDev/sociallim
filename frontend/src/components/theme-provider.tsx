/**
 * Theme Provider component using next-themes
 * Provides dark/light mode functionality with system preference detection
 */

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

/**
 * Theme provider wrapper component
 * Configures next-themes with our application settings
 */
export function ThemeProvider({ children, attribute = "class", defaultTheme = "system", enableSystem = true, disableTransitionOnChange = false, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme} enableSystem={enableSystem} disableTransitionOnChange={disableTransitionOnChange} {...props}>
      {children}
    </NextThemesProvider>
  );
}

/**
 * Hook for accessing theme functionality
 * Re-exports useTheme from next-themes for convenience
 */
export { useTheme } from "next-themes";
