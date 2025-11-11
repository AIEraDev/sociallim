/**
 * Global error handler hook
 * Provides consistent error handling across the application
 */

import { useCallback } from "react";
import { useToast, errorToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: Error | ApiError) => void;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleErrorToast = useCallback(
    (error: unknown, fallbackMessage: string) => {
      // Handle API errors with specific error codes
      if (error && typeof error === "object" && "code" in error) {
        const apiError = error as ApiError;

        switch (apiError.code) {
          case "NETWORK_ERROR":
            errorToast.network(toast);
            break;

          case "AUTHENTICATION_ERROR":
          case "TOKEN_EXPIRED":
          case "INVALID_TOKEN":
            errorToast.authentication(toast);
            break;

          case "AUTHORIZATION_ERROR":
            errorToast.authorization(toast);
            break;

          case "VALIDATION_ERROR":
            errorToast.validation(toast, apiError.userMessage || apiError.message);
            break;

          case "RATE_LIMITED":
            const retryAfter = apiError.details?.retryAfter;
            errorToast.rateLimited(toast, typeof retryAfter === "number" ? retryAfter : undefined);
            break;

          case "SERVICE_UNAVAILABLE":
          case "EXTERNAL_SERVICE_ERROR":
            toast.error("Service Unavailable", apiError.userMessage || "Service is temporarily unavailable. Please try again later.", {
              action: {
                label: "Retry",
                onClick: () => window.location.reload(),
              },
            });
            break;

          default:
            toast.error("Error", apiError.userMessage || apiError.message || fallbackMessage);
        }
      } else if (error instanceof Error) {
        // Handle regular JavaScript errors
        toast.error("Error", error.message || fallbackMessage);
      } else if (typeof error === "string") {
        // Handle string errors
        toast.error("Error", error);
      } else {
        // Handle unknown error types
        toast.error("Error", fallbackMessage);
      }
    },
    [toast]
  );

  const handleError = useCallback(
    (error: Error | ApiError | unknown, options: ErrorHandlerOptions = {}) => {
      const { showToast = true, logError = true, fallbackMessage = "An unexpected error occurred", onError } = options;

      // Log error if enabled
      if (logError) {
        console.error("Error handled by useErrorHandler:", error);
      }

      // Call custom error handler if provided
      if (onError && (error instanceof Error || (error && typeof error === "object" && "code" in error))) {
        onError(error as Error | ApiError);
      }

      // Show toast notification if enabled
      if (showToast) {
        handleErrorToast(error, fallbackMessage);
      }

      // Emit global error event for tracking
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("app:error", {
            detail: { error, timestamp: new Date().toISOString() },
          })
        );
      }
    },
    [handleErrorToast]
  );

  const handleAsyncError = useCallback(
    async (asyncOperation: () => Promise<unknown>, options: ErrorHandlerOptions = {}) => {
      try {
        return await asyncOperation();
      } catch (error) {
        handleError(error, options);
        throw error; // Re-throw so calling code can handle it if needed
      }
    },
    [handleError]
  );

  const handleApiResponse = useCallback(
    <T>(response: { success: boolean; data?: T; error?: ApiError }, options: ErrorHandlerOptions = {}): T | null => {
      if (!response.success && response.error) {
        handleError(response.error, options);
        return null;
      }
      return response.data || null;
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    handleApiResponse,
  };
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);

    // Emit custom event for error tracking
    window.dispatchEvent(
      new CustomEvent("app:error", {
        detail: {
          error: event.reason,
          type: "unhandledrejection",
          timestamp: new Date().toISOString(),
        },
      })
    );

    // Prevent default browser behavior
    event.preventDefault();
  });

  // Handle global JavaScript errors
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);

    // Emit custom event for error tracking
    window.dispatchEvent(
      new CustomEvent("app:error", {
        detail: {
          error: event.error,
          type: "javascript",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
        },
      })
    );
  });

  // Handle authentication errors from API client
  window.addEventListener("auth:error", (event: Event) => {
    const customEvent = event as CustomEvent;
    console.warn("Authentication error:", customEvent.detail);

    // Redirect to login page or show login modal
    // This depends on your authentication flow
    window.location.href = "/auth";
  });
}

// Utility functions for common error scenarios
export const errorHandlers = {
  // Handle form submission errors
  formSubmission: (error: unknown, fieldName?: string) => {
    if (error && typeof error === "object" && "code" in error && error.code === "VALIDATION_ERROR" && "details" in error) {
      // Handle field-specific validation errors
      const errorObj = error as { details: Record<string, string>; message?: string };
      const fieldError = fieldName && errorObj.details[fieldName];
      return fieldError || errorObj.message || "Please check your input and try again.";
    }
    if (error && typeof error === "object" && ("userMessage" in error || "message" in error)) {
      const errorObj = error as { userMessage?: string; message?: string };
      return errorObj.userMessage || errorObj.message || "Failed to submit form. Please try again.";
    }
    return "Failed to submit form. Please try again.";
  },

  // Handle file upload errors
  fileUpload: (error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "FILE_UPLOAD_ERROR" && "details" in error) {
      const errorObj = error as { details: { code: string } };
      switch (errorObj.details.code) {
        case "LIMIT_FILE_SIZE":
          return "File size exceeds the maximum allowed limit.";
        case "LIMIT_FILE_COUNT":
          return "Too many files uploaded.";
        case "LIMIT_UNEXPECTED_FILE":
          return "Unexpected file in upload.";
        default:
          return "File upload failed. Please try again.";
      }
    }
    if (error && typeof error === "object" && ("userMessage" in error || "message" in error)) {
      const errorObj = error as { userMessage?: string; message?: string };
      return errorObj.userMessage || errorObj.message || "File upload failed. Please try again.";
    }
    return "File upload failed. Please try again.";
  },

  // Handle data loading errors
  dataLoading: (error: unknown, resourceName: string = "data") => {
    if (error && typeof error === "object" && "code" in error && error.code === "NOT_FOUND_ERROR") {
      return `${resourceName} not found.`;
    }
    if (error && typeof error === "object" && ("userMessage" in error || "message" in error)) {
      const errorObj = error as { userMessage?: string; message?: string };
      return errorObj.userMessage || errorObj.message || `Failed to load ${resourceName}. Please try again.`;
    }
    return `Failed to load ${resourceName}. Please try again.`;
  },
};
