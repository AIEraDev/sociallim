import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Minimal middleware for NextAuth
 *
 * This middleware only handles NextAuth-specific routes and doesn't
 * interfere with your existing AuthGuard component which handles
 * your backend authentication.
 */
export function middleware(request: NextRequest) {
  // Only handle NextAuth API routes
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Let your AuthGuard component handle all other route protection
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
