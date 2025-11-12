/**
 * Core TypeScript types for the Comment Sentiment Analyzer application
 * These types match the Prisma schema and API responses from the backend
 */

// Platform and Sentiment enums matching backend
export enum Platform {
  YOUTUBE = "YOUTUBE",
  INSTAGRAM = "INSTAGRAM",
  TWITTER = "TWITTER",
  TIKTOK = "TIKTOK",
  FACEBOOK = "FACEBOOK",
}

export enum Sentiment {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  NEUTRAL = "NEUTRAL",
}

// Core data models
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedPlatform {
  id: string;
  platform: Platform;
  platformUserId: string;
  connectedAt: string;
  tokenExpiresAt: Date | null;
}

export interface Post {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl?: string;
  description?: string;
  viewCount?: number;
  likeCount?: number;
  hasComments?: boolean;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  platformCommentId: string;
  text: string;
  authorName: string;
  publishedAt: string;
  likeCount: number;
  isFiltered: boolean;
  filterReason?: string;
  createdAt: string;
  postId: string;
}

// Analysis result models
export interface SentimentBreakdown {
  id: string;
  positive: number;
  negative: number;
  neutral: number;
  confidenceScore: number;
}

export interface Emotion {
  id: string;
  name: string;
  percentage: number;
}

export interface Theme {
  id: string;
  name: string;
  frequency: number;
  sentiment: Sentiment;
  exampleComments: string[];
}

export interface Keyword {
  id: string;
  word: string;
  frequency: number;
  sentiment: Sentiment;
  contexts: string[];
}

export interface AnalysisResult {
  id: string;
  totalComments: number;
  filteredComments: number;
  summary: string;
  analyzedAt: string;
  postId: string;
  userId: string;
  sentimentBreakdown?: SentimentBreakdown;
  emotions: Emotion[];
  themes: Theme[];
  keywords: Keyword[];
  post?: Post;
}

// Extended types with relations for UI components
export interface UserWithPlatforms extends User {
  connectedPlatforms: ConnectedPlatform[];
}

export interface PostWithComments extends Post {
  comments: Comment[];
  user: User;
}

export interface AnalysisResultWithDetails extends AnalysisResult {
  sentimentBreakdown: SentimentBreakdown;
  emotions: Emotion[];
  themes: Theme[];
  keywords: Keyword[];
  post: Post;
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CookieAuthResponse {
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Analysis job types
export interface AnalysisJob {
  id: string;
  postId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Export and comparison types
export interface ExportRequest {
  analysisId: string;
  format: "pdf" | "csv" | "json" | "image";
  includeRawData?: boolean;
}

export interface ComparisonRequest {
  analysisIds: string[];
}

export interface ComparisonResult {
  analyses: AnalysisResultWithDetails[];
  insights: {
    bestPerforming: string;
    trends: string[];
    recommendations: string[];
  };
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Platform connection status
export interface PlatformConnectionStatus {
  platform: Platform;
  isConnected: boolean;
  lastSync?: string;
  error?: string;
}

// Theme configuration
export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
}
