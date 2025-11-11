/**
 * TanStack Query Provider component
 * Provides query client context to the entire application
 */

"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query provider component that creates and provides QueryClient
 * Uses state to ensure client is created only once per component lifecycle
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client only once per component lifecycle
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  );
}
