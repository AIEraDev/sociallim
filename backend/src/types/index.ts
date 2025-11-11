import { User, ConnectedPlatform, Post, Comment, AnalysisResult, SentimentBreakdown, Emotion, Theme, Keyword, Platform, Sentiment } from "@prisma/client";

// Extended types with relations
export type UserWithPlatforms = User & {
  connectedPlatforms: ConnectedPlatform[];
};

export type PostWithComments = Post & {
  comments: Comment[];
  user: User;
};

export type AnalysisResultWithDetails = AnalysisResult & {
  sentimentBreakdown: SentimentBreakdown | null;
  emotions: Emotion[];
  themes: Theme[];
  keywords: Keyword[];
  post: Post;
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status: number;
    timestamp: string;
    details?: any;
  };
}

// OAuth types
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  platform: Platform;
}

// Analysis types
export interface AnalysisJob {
  id: string;
  postId: string;
  userId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface SentimentAnalysisResult {
  sentiment: Sentiment;
  confidence: number;
  emotions: {
    name: string;
    score: number;
  }[];
}

export interface ThemeCluster {
  name: string;
  comments: Comment[];
  sentiment: Sentiment;
  frequency: number;
}

// Export Prisma types and extended types
export { User, ConnectedPlatform, Post, Comment, AnalysisResult, SentimentBreakdown, Emotion, Theme, Keyword, Platform, Sentiment };
export * from "./prisma";
