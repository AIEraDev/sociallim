import { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";

/**
 * NextAuth Configuration for Social Media OAuth ONLY
 *
 * This configuration is ONLY used for obtaining OAuth tokens
 * to access social media APIs (Facebook, Twitter, Instagram).
 *
 * It does NOT handle user authentication - that's handled by your backend.
 * Users must be logged in through your backend before they can connect social accounts.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights",
        },
      },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // Using stable OAuth 1.0a (default) instead of beta OAuth 2.0
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle Twitter callback redirect - check if the callbackUrl contains our success page
      if (url.includes("/auth/callback/twitter-success")) {
        return url;
      }

      // If it's a relative URL starting with /, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // If it's already an absolute URL with the same origin, use it
      if (new URL(url).origin === baseUrl) return url;

      // Default fallback
      return baseUrl;
    },
    async jwt({ token, account, profile }) {
      // Store OAuth tokens for social media API access
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Provide OAuth tokens to the client for API calls
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.provider = token.provider as string;
      session.providerAccountId = token.providerAccountId as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
  },
  pages: {
    // Don't use NextAuth for sign in - redirect to your auth page
    signIn: "/auth?message=please-login-first",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
