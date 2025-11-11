/**
 * Toast notification system for user feedback
 * Provides consistent error, success, and info messages
 */

"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 11);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = React.useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 150);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    }
  };

  return (
    <div className={cn("relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-150 ease-in-out", getBackgroundColor(), isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0")}>
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toast.title}</p>}
        {toast.description && <p className={cn("text-sm text-gray-600 dark:text-gray-300", toast.title && "mt-1")}>{toast.description}</p>}
        {toast.action && (
          <button onClick={toast.action.onClick} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            {toast.action.label}
          </button>
        )}
      </div>

      <button onClick={handleRemove} className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast, removeToast, clearToasts } = context;

  const toast = React.useMemo(
    () => ({
      success: (title: string, description?: string, options?: Partial<Toast>) => addToast({ type: "success", title, description, ...options }),

      error: (title: string, description?: string, options?: Partial<Toast>) => addToast({ type: "error", title, description, ...options }),

      warning: (title: string, description?: string, options?: Partial<Toast>) => addToast({ type: "warning", title, description, ...options }),

      info: (title: string, description?: string, options?: Partial<Toast>) => addToast({ type: "info", title, description, ...options }),

      custom: (toast: Omit<Toast, "id">) => addToast(toast),
    }),
    [addToast]
  );

  return {
    toast,
    removeToast,
    clearToasts,
  };
}

// Utility functions for common error scenarios
export const errorToast = {
  network: (toast: ReturnType<typeof useToast>["toast"]) => toast.error("Connection Error", "Unable to connect to the server. Please check your internet connection and try again."),

  authentication: (toast: ReturnType<typeof useToast>["toast"]) =>
    toast.error("Authentication Required", "Please log in to continue.", {
      action: {
        label: "Log In",
        onClick: () => (window.location.href = "/auth"),
      },
    }),

  authorization: (toast: ReturnType<typeof useToast>["toast"]) => toast.error("Access Denied", "You don't have permission to perform this action."),

  validation: (toast: ReturnType<typeof useToast>["toast"], message?: string) => toast.error("Validation Error", message || "Please check your input and try again."),

  serverError: (toast: ReturnType<typeof useToast>["toast"]) => toast.error("Server Error", "Something went wrong on our end. Please try again later."),

  rateLimited: (toast: ReturnType<typeof useToast>["toast"], retryAfter?: number) => toast.warning("Rate Limited", retryAfter ? `Too many requests. Please wait ${retryAfter} seconds before trying again.` : "Too many requests. Please wait a moment before trying again."),
};
