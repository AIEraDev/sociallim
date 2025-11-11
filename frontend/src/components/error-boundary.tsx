/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the component tree
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

/**
 * Default error fallback component with enhanced error reporting
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [errorId] = React.useState(() => `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${error?.message || "Application Error"}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]

Stack Trace:
${error?.stack}
    `);

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  const handleCopyErrorDetails = async () => {
    const errorDetails = `
Error ID: ${errorId}
Error: ${error?.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
Stack: ${error?.stack}
    `;

    try {
      await navigator.clipboard.writeText(errorDetails);
      // You could show a toast notification here
      console.log("Error details copied to clipboard");
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <CardDescription className="text-lg">We encountered an unexpected error. Don&apos;t worry, our team has been notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Error ID:</strong> <code className="font-mono bg-muted px-1 rounded">{errorId}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Please include this ID when reporting the issue.</p>
          </div>

          {error && (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="text-muted-foreground">
                {showDetails ? "Hide" : "Show"} Technical Details
              </Button>

              {showDetails && (
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <strong className="text-sm">Error Message:</strong>
                    <p className="text-sm font-mono mt-1 text-muted-foreground">{error.message}</p>
                  </div>

                  {error.stack && (
                    <div>
                      <strong className="text-sm">Stack Trace:</strong>
                      <pre className="text-xs font-mono mt-1 p-2 bg-background rounded border overflow-x-auto max-h-40">{error.stack}</pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyErrorDetails}>
                      Copy Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleReportBug}>
                      Report Bug
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
              Go Home
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>If this problem persists, please contact our support team.</p>
            <p className="mt-1">
              <a href="mailto:support@example.com" className="text-primary hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error Boundary class component
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // Log error with additional context
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem("userId"), // if available
      };

      // In a real application, send to error monitoring service
      // Example: Sentry.captureException(error, { extra: errorData });

      console.error("Error logged:", errorData);

      // Emit custom event for error tracking
      window.dispatchEvent(
        new CustomEvent("app:error", {
          detail: errorData,
        })
      );
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Hook for error handling in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error);
    setError(error);
  }, []);

  // Throw error to be caught by Error Boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}
