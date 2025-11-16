import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import FacebookSDK from "@/components/FacebookSDK";

// Using system fonts for better performance and reliability
const fontSans = {
  variable: "--font-sans",
};

export const metadata: Metadata = {
  title: "EchoMind - Comment Sentiment Analyzer",
  description: "AI-powered sentiment analysis for social media comments. Understand your audience better with intelligent insights.",
  keywords: ["sentiment analysis", "social media", "AI", "comments", "analytics"],
  authors: [{ name: "EchoMind Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <FacebookSDK />
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
