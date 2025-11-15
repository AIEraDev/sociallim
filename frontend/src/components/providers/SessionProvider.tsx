"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Social Media OAuth Session Provider
 *
 * This provider ONLY handles social media OAuth tokens for API access.
 * It does NOT handle user authentication - that's your backend's job.
 *
 * IMPORTANT:
 * - Users must login through your backend authentication FIRST
 * - Only then can they use this to connect social media accounts
 * - This provides OAuth tokens for Facebook/Twitter/Instagram APIs
 * - Your existing AuthGuard component handles all route protection
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Don't redirect on unauthenticated - let your AuthGuard handle it
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
