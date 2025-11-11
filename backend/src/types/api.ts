/**
 * Comprehensive API Request and Response Types
 *
 * This file contains all TypeScript interfaces for API endpoints,
 * providing type safety and documentation for the Comment Sentiment Analyzer API.
 *
 * @fileoverview API type definitions with comprehensive JSDoc documentation
 * @version 1.0.0
 * @author Comment Sentiment Analyzer Team
 */

import { Platform, Sentiment, User, Post, AnalysisResult, ConnectedPlatform } from "@prisma/client";

// ============================================================================
// COMMON API TYPES
// ============================================================================

/**
 * Standard API response wrapper for all endpoints
 * Provides consistent response structure across the application
 *
 * @template T - The type of data being returned
 */
export interface ApiResponse<T = any> {
  /** Indicates if the request was successful */
  success: boolean;
  /** The response data (only present on success) */
  data?: T;
  /** Error information (only present on failure) */
  error?: ApiError;
  /** Optional message providing additional context */
  message?: string;
  /** Request correlation ID for debugging */
  correlationId?: string;
  /** Response timestamp */
  timestamp?: string;
}

/**
 * Standardized error structure for API responses
 * Provides detailed error information for client-side handling
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code for programmatic handling */
  code: string;
  /** HTTP status code */
  status: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Whether this error is retryable */
  retryable?: boolean;
  /** Request correlation ID for debugging */
  correlationId?: string;
  /** User-friendly error message for display */
  userMessage?: string;
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Pagination metadata for list endpoints
 * Supports cursor-based and offset-based pagination
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items available */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more items after current page */
  hasNext: boolean;
  /** Whether there are items before current page */
  hasPrev: boolean;
  /** Cursor for next page (cursor-based pagination) */
  nextCursor?: string;
  /** Cursor for previous page (cursor-based pagination) */
  prevCursor?: string;
}

/**
 * Paginated response wrapper for list endpoints
 *
 * @template T - The type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

// ============================================================================
// AUTHENTICATION API TYPES
// ============================================================================

/**
 * User registration request payload
 * Contains all required information for creating a new user account
 */
export interface RegisterRequest {
  /** User's email address (must be unique) */
  email: string;
  /** User's password (must meet security requirements) */
  password: string;
  /** User's first name (optional) */
  firstName?: string;
  /** User's last name (optional) */
  lastName?: string;
  /** Terms of service acceptance timestamp */
  termsAcceptedAt?: string;
  /** Marketing email opt-in preference */
  marketingOptIn?: boolean;
}

/**
 * User login request payload
 * Contains credentials for user authentication
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** Whether to remember the user session */
  rememberMe?: boolean;
}

/**
 * Authentication response containing user data and access token
 * Returned on successful login or registration
 */
export interface AuthResponse {
  /** Authenticated user information (without sensitive data) */
  user: AuthenticatedUser;
  /** JWT access token for API authentication */
  token: string;
  /** Token expiration timestamp */
  expiresAt: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken?: string;
}

/**
 * User profile information without sensitive data
 * Used in API responses to avoid exposing passwords or tokens
 */
export interface AuthenticatedUser {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Account creation timestamp */
  createdAt: string;
  /** Last profile update timestamp */
  updatedAt: string;
  /** Last login timestamp */
  lastLoginAt?: string;
  /** Whether email is verified */
  emailVerified: boolean;
  /** User's timezone */
  timezone?: string;
  /** User's preferred language */
  language?: string;
}

/**
 * Password change request payload
 * Used for updating user passwords
 */
export interface ChangePasswordRequest {
  /** Current password for verification */
  currentPassword: string;
  /** New password (must meet security requirements) */
  newPassword: string;
  /** Confirmation of new password */
  confirmPassword: string;
}

/**
 * Profile update request payload
 * Contains fields that can be updated in user profile
 */
export interface UpdateProfileRequest {
  /** Updated email address */
  email?: string;
  /** Updated first name */
  firstName?: string;
  /** Updated last name */
  lastName?: string;
  /** Updated timezone */
  timezone?: string;
  /** Updated language preference */
  language?: string;
}

// ============================================================================
// SOCIAL MEDIA PLATFORM API TYPES
// ============================================================================

/**
 * OAuth connection initiation response
 * Contains the authorization URL for platform OAuth flow
 */
export interface OAuthInitiationResponse {
  /** OAuth authorization URL to redirect user to */
  authUrl: string;
  /** OAuth state parameter for CSRF protection */
  state: string;
  /** Platform being connected */
  platform: Platform;
}

/**
 * OAuth callback request payload
 * Contains authorization code from OAuth provider
 */
export interface OAuthCallbackRequest {
  /** Authorization code from OAuth provider */
  code: string;
  /** OAuth state parameter for verification */
  state: string;
  /** Platform being connected */
  platform: Platform;
}

/**
 * Connected platform information with status
 * Represents a user's connected social media account
 */
export interface ConnectedPlatformResponse {
  /** Unique platform connection identifier */
  id: string;
  /** Social media platform type */
  platform: Platform;
  /** User ID on the connected platform */
  platformUserId: string;
  /** Platform username or handle */
  platformUsername?: string;
  /** Platform display name */
  platformDisplayName?: string;
  /** Connection establishment timestamp */
  connectedAt: string;
  /** Last successful data sync timestamp */
  lastSyncAt?: string;
  /** Whether the connection is currently active */
  isActive: boolean;
  /** Token expiration timestamp */
  tokenExpiresAt?: string;
  /** Connection health status */
  status: "active" | "expired" | "error" | "revoked";
  /** Error message if connection has issues */
  errorMessage?: string;
}

/**
 * Platform connection status summary
 * Provides overview of all platform connections
 */
export interface PlatformConnectionSummary {
  /** Total number of connected platforms */
  totalConnected: number;
  /** Number of active connections */
  activeConnections: number;
  /** Number of connections with errors */
  errorConnections: number;
  /** List of connected platforms with status */
  platforms: ConnectedPlatformResponse[];
}

// ============================================================================
// POSTS AND COMMENTS API TYPES
// ============================================================================

/**
 * Request parameters for fetching user posts
 * Supports filtering and pagination
 */
export interface FetchPostsRequest {
  /** Filter by specific platform */
  platform?: Platform;
  /** Maximum number of posts to return */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Date range start (ISO string) */
  dateFrom?: string;
  /** Date range end (ISO string) */
  dateTo?: string;
  /** Search query for post titles */
  search?: string;
  /** Sort order */
  sortBy?: "publishedAt" | "createdAt" | "title";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Social media post information
 * Represents a post from any connected platform
 */
export interface PostResponse {
  /** Unique post identifier */
  id: string;
  /** Platform where post was published */
  platform: Platform;
  /** Platform-specific post ID */
  platformPostId: string;
  /** Post title or caption */
  title: string;
  /** Direct URL to the post */
  url: string;
  /** Post publication timestamp */
  publishedAt: string;
  /** Post creation in our system timestamp */
  createdAt: string;
  /** Post thumbnail URL */
  thumbnailUrl?: string;
  /** Post description or excerpt */
  description?: string;
  /** Number of views (if available) */
  viewCount?: number;
  /** Number of likes */
  likeCount?: number;
  /** Number of comments */
  commentCount?: number;
  /** Whether post has been analyzed */
  hasAnalysis: boolean;
  /** Most recent analysis ID */
  latestAnalysisId?: string;
  /** Post engagement metrics */
  engagement?: PostEngagementMetrics;
}

/**
 * Post engagement metrics
 * Provides detailed engagement statistics for a post
 */
export interface PostEngagementMetrics {
  /** Total engagement count (likes + comments + shares) */
  totalEngagement: number;
  /** Engagement rate as percentage */
  engagementRate: number;
  /** Number of shares/retweets */
  shareCount?: number;
  /** Average sentiment score (-1 to 1) */
  averageSentiment?: number;
  /** Dominant sentiment category */
  dominantSentiment?: Sentiment;
}

/**
 * Comment information from social media posts
 * Represents individual comments with metadata
 */
export interface CommentResponse {
  /** Unique comment identifier */
  id: string;
  /** Platform-specific comment ID */
  platformCommentId: string;
  /** Comment text content */
  text: string;
  /** Comment author's display name */
  authorName: string;
  /** Comment publication timestamp */
  publishedAt: string;
  /** Number of likes on comment */
  likeCount: number;
  /** Whether comment was filtered out */
  isFiltered: boolean;
  /** Reason for filtering (if filtered) */
  filterReason?: string;
  /** Parent comment ID (for replies) */
  parentCommentId?: string;
  /** Number of replies to this comment */
  replyCount?: number;
  /** Sentiment analysis result (if analyzed) */
  sentiment?: Sentiment;
  /** Sentiment confidence score */
  sentimentConfidence?: number;
}

// ============================================================================
// ANALYSIS API TYPES
// ============================================================================

/**
 * Analysis initiation request
 * Starts sentiment analysis for a specific post
 */
export interface StartAnalysisRequest {
  /** Post ID to analyze */
  postId: string;
  /** Analysis configuration options */
  options?: AnalysisOptions;
}

/**
 * Analysis configuration options
 * Allows customization of analysis behavior
 */
export interface AnalysisOptions {
  /** Whether to include spam detection */
  includeSpamDetection?: boolean;
  /** Whether to include toxicity filtering */
  includeToxicityFilter?: boolean;
  /** Maximum number of comments to analyze */
  maxComments?: number;
  /** Minimum comment length to include */
  minCommentLength?: number;
  /** Languages to include (ISO codes) */
  includeLanguages?: string[];
  /** Whether to analyze comment replies */
  includeReplies?: boolean;
  /** Sentiment analysis model to use */
  sentimentModel?: "standard" | "enhanced" | "multilingual";
}

/**
 * Analysis job status and progress information
 * Tracks the progress of ongoing analysis jobs
 */
export interface AnalysisJobResponse {
  /** Unique job identifier */
  id: string;
  /** Post being analyzed */
  postId: string;
  /** Job status */
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  /** Progress percentage (0-100) */
  progress: number;
  /** Current processing step */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Description of current step */
  stepDescription: string;
  /** Job creation timestamp */
  createdAt: string;
  /** Job start timestamp */
  startedAt?: string;
  /** Job completion timestamp */
  completedAt?: string;
  /** Error message (if failed) */
  error?: string;
  /** Estimated completion time */
  estimatedCompletionAt?: string;
  /** Analysis result ID (if completed) */
  analysisResultId?: string;
}

/**
 * Complete analysis result with all insights
 * Contains comprehensive sentiment analysis results
 */
export interface AnalysisResultResponse {
  /** Unique analysis result identifier */
  id: string;
  /** Analyzed post information */
  post: PostResponse;
  /** Total number of comments analyzed */
  totalComments: number;
  /** Number of comments filtered out */
  filteredComments: number;
  /** AI-generated summary of sentiment */
  summary: string;
  /** Analysis completion timestamp */
  analyzedAt: string;
  /** Sentiment distribution breakdown */
  sentimentBreakdown: SentimentBreakdownResponse;
  /** Detected emotions with percentages */
  emotions: EmotionResponse[];
  /** Identified themes and topics */
  themes: ThemeResponse[];
  /** Most frequent keywords */
  keywords: KeywordResponse[];
  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

/**
 * Sentiment distribution breakdown
 * Shows percentage distribution of sentiment categories
 */
export interface SentimentBreakdownResponse {
  /** Percentage of positive comments (0-100) */
  positive: number;
  /** Percentage of negative comments (0-100) */
  negative: number;
  /** Percentage of neutral comments (0-100) */
  neutral: number;
  /** Overall confidence score (0-1) */
  confidenceScore: number;
  /** Sentiment trend over time */
  trend?: "improving" | "declining" | "stable";
  /** Comparison to user's average */
  comparisonToAverage?: number;
}

/**
 * Emotion detection result
 * Represents detected emotions with intensity
 */
export interface EmotionResponse {
  /** Emotion name (joy, anger, surprise, etc.) */
  name: string;
  /** Emotion intensity percentage (0-100) */
  percentage: number;
  /** Representative comments for this emotion */
  exampleComments?: string[];
  /** Emotion category (positive, negative, neutral) */
  category: "positive" | "negative" | "neutral";
}

/**
 * Theme clustering result
 * Represents grouped similar comments by topic
 */
export interface ThemeResponse {
  /** Theme name or topic */
  name: string;
  /** Number of comments in this theme */
  frequency: number;
  /** Dominant sentiment for this theme */
  sentiment: Sentiment;
  /** Representative comments */
  exampleComments: string[];
  /** Theme relevance score (0-1) */
  relevanceScore: number;
  /** Related keywords */
  relatedKeywords: string[];
}

/**
 * Keyword extraction result
 * Represents frequently mentioned words with context
 */
export interface KeywordResponse {
  /** The keyword or phrase */
  word: string;
  /** Frequency of occurrence */
  frequency: number;
  /** Associated sentiment */
  sentiment: Sentiment;
  /** Context examples where keyword appears */
  contexts: string[];
  /** Keyword importance score (0-1) */
  importance: number;
  /** Related keywords */
  relatedWords: string[];
}

/**
 * Analysis metadata and configuration
 * Contains technical details about the analysis process
 */
export interface AnalysisMetadata {
  /** Analysis model version used */
  modelVersion: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Analysis configuration used */
  configuration: AnalysisOptions;
  /** Quality metrics */
  qualityMetrics: {
    /** Data quality score (0-1) */
    dataQuality: number;
    /** Analysis confidence (0-1) */
    analysisConfidence: number;
    /** Coverage percentage */
    coverage: number;
  };
  /** Language distribution */
  languageDistribution: Record<string, number>;
}

// ============================================================================
// EXPORT AND COMPARISON API TYPES
// ============================================================================

/**
 * Analysis export request
 * Specifies format and options for exporting analysis results
 */
export interface ExportAnalysisRequest {
  /** Analysis result ID to export */
  analysisId: string;
  /** Export format */
  format: "pdf" | "csv" | "json" | "xlsx" | "png" | "svg";
  /** Export options */
  options?: ExportOptions;
}

/**
 * Export configuration options
 * Customizes the content and format of exports
 */
export interface ExportOptions {
  /** Whether to include raw comment data */
  includeRawData?: boolean;
  /** Whether to include charts and visualizations */
  includeCharts?: boolean;
  /** Whether to include detailed breakdowns */
  includeDetails?: boolean;
  /** Custom branding options */
  branding?: {
    /** Company/user name */
    companyName?: string;
    /** Logo URL */
    logoUrl?: string;
    /** Custom colors */
    colors?: {
      primary: string;
      secondary: string;
    };
  };
  /** Date range for data inclusion */
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Export result with download information
 * Contains download URL and metadata for exported files
 */
export interface ExportResponse {
  /** Unique export identifier */
  exportId: string;
  /** Download URL (expires after 24 hours) */
  downloadUrl: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Export format */
  format: string;
  /** Export creation timestamp */
  createdAt: string;
  /** Download URL expiration timestamp */
  expiresAt: string;
}

/**
 * Analysis comparison request
 * Compares multiple analysis results
 */
export interface CompareAnalysesRequest {
  /** Array of analysis IDs to compare */
  analysisIds: string[];
  /** Comparison options */
  options?: ComparisonOptions;
}

/**
 * Comparison configuration options
 * Customizes the comparison analysis
 */
export interface ComparisonOptions {
  /** Metrics to compare */
  metrics?: ("sentiment" | "emotions" | "themes" | "keywords" | "engagement")[];
  /** Whether to include trend analysis */
  includeTrends?: boolean;
  /** Whether to include recommendations */
  includeRecommendations?: boolean;
}

/**
 * Analysis comparison result
 * Contains comparative insights across multiple analyses
 */
export interface ComparisonResponse {
  /** Compared analyses with metadata */
  analyses: AnalysisResultResponse[];
  /** Comparative insights */
  insights: ComparisonInsights;
  /** Trend analysis */
  trends: TrendAnalysis;
  /** AI-generated recommendations */
  recommendations: string[];
}

/**
 * Comparative insights between analyses
 * Highlights differences and patterns across analyses
 */
export interface ComparisonInsights {
  /** Best performing analysis ID */
  bestPerforming: string;
  /** Worst performing analysis ID */
  worstPerforming: string;
  /** Average sentiment across all analyses */
  averageSentiment: number;
  /** Sentiment variance */
  sentimentVariance: number;
  /** Common themes across analyses */
  commonThemes: string[];
  /** Unique themes per analysis */
  uniqueThemes: Record<string, string[]>;
  /** Engagement correlation with sentiment */
  engagementCorrelation: number;
}

/**
 * Trend analysis across time periods
 * Shows how metrics change over time
 */
export interface TrendAnalysis {
  /** Sentiment trend direction */
  sentimentTrend: "improving" | "declining" | "stable";
  /** Engagement trend direction */
  engagementTrend: "increasing" | "decreasing" | "stable";
  /** Trend confidence score (0-1) */
  confidence: number;
  /** Key trend drivers */
  drivers: string[];
  /** Predicted future performance */
  predictions?: {
    /** Predicted sentiment for next period */
    nextPeriodSentiment: number;
    /** Confidence in prediction (0-1) */
    predictionConfidence: number;
  };
}

// ============================================================================
// SYSTEM AND HEALTH API TYPES
// ============================================================================

/**
 * System health check response
 * Provides status of various system components
 */
export interface HealthCheckResponse {
  /** Overall system status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Health check timestamp */
  timestamp: string;
  /** Individual component statuses */
  components: {
    /** Database connectivity */
    database: ComponentHealth;
    /** Prisma Accelerate cache */
    cache: ComponentHealth;
    /** AI services */
    aiServices: ComponentHealth;
    /** Social media APIs */
    socialMediaApis: Record<Platform, ComponentHealth>;
  };
  /** System metrics */
  metrics: SystemMetrics;
}

/**
 * Individual component health status
 * Represents the health of a system component
 */
export interface ComponentHealth {
  /** Component status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Response time in milliseconds */
  responseTime?: number;
  /** Error message if unhealthy */
  error?: string;
  /** Last check timestamp */
  lastCheck: string;
}

/**
 * System performance metrics
 * Provides insights into system performance
 */
export interface SystemMetrics {
  /** API response time percentiles */
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  /** Request rate per minute */
  requestRate: number;
  /** Error rate percentage */
  errorRate: number;
  /** Active analysis jobs */
  activeJobs: number;
  /** Queue depth */
  queueDepth: number;
}

// ============================================================================
// VALIDATION AND ERROR TYPES
// ============================================================================

/**
 * Field validation error
 * Represents validation errors for specific form fields
 */
export interface FieldValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation rule that failed */
  rule: string;
  /** Rejected value */
  rejectedValue: any;
}

/**
 * Bulk validation result
 * Contains validation results for multiple fields
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Field-specific errors */
  fieldErrors: FieldValidationError[];
  /** General validation messages */
  messages: string[];
}

// ============================================================================
// WEBHOOK AND NOTIFICATION TYPES
// ============================================================================

/**
 * Webhook event payload
 * Represents events sent to webhook endpoints
 */
export interface WebhookEvent {
  /** Event type */
  type: "analysis.completed" | "analysis.failed" | "platform.connected" | "platform.disconnected";
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: Record<string, any>;
  /** Event ID for deduplication */
  eventId: string;
  /** User ID associated with event */
  userId: string;
}

/**
 * Notification preferences
 * User's notification settings
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email: boolean;
  /** Push notifications enabled */
  push: boolean;
  /** Webhook notifications enabled */
  webhook: boolean;
  /** Notification types to receive */
  types: ("analysis.completed" | "analysis.failed" | "weekly.summary")[];
}

// Re-export commonly used types for convenience
export type { Platform, Sentiment, User, Post, AnalysisResult, ConnectedPlatform };
