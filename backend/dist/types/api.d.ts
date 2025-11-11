import { Platform, Sentiment, User, Post, AnalysisResult, ConnectedPlatform } from "@prisma/client";
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
    correlationId?: string;
    timestamp?: string;
}
export interface ApiError {
    message: string;
    code: string;
    status: number;
    details?: Record<string, any>;
    retryable?: boolean;
    correlationId?: string;
    userMessage?: string;
    fieldErrors?: Record<string, string[]>;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    termsAcceptedAt?: string;
    marketingOptIn?: boolean;
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface AuthResponse {
    user: AuthenticatedUser;
    token: string;
    expiresAt: string;
    refreshToken?: string;
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    emailVerified: boolean;
    timezone?: string;
    language?: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export interface UpdateProfileRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
    language?: string;
}
export interface OAuthInitiationResponse {
    authUrl: string;
    state: string;
    platform: Platform;
}
export interface OAuthCallbackRequest {
    code: string;
    state: string;
    platform: Platform;
}
export interface ConnectedPlatformResponse {
    id: string;
    platform: Platform;
    platformUserId: string;
    platformUsername?: string;
    platformDisplayName?: string;
    connectedAt: string;
    lastSyncAt?: string;
    isActive: boolean;
    tokenExpiresAt?: string;
    status: "active" | "expired" | "error" | "revoked";
    errorMessage?: string;
}
export interface PlatformConnectionSummary {
    totalConnected: number;
    activeConnections: number;
    errorConnections: number;
    platforms: ConnectedPlatformResponse[];
}
export interface FetchPostsRequest {
    platform?: Platform;
    limit?: number;
    page?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: "publishedAt" | "createdAt" | "title";
    sortOrder?: "asc" | "desc";
}
export interface PostResponse {
    id: string;
    platform: Platform;
    platformPostId: string;
    title: string;
    url: string;
    publishedAt: string;
    createdAt: string;
    thumbnailUrl?: string;
    description?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    hasAnalysis: boolean;
    latestAnalysisId?: string;
    engagement?: PostEngagementMetrics;
}
export interface PostEngagementMetrics {
    totalEngagement: number;
    engagementRate: number;
    shareCount?: number;
    averageSentiment?: number;
    dominantSentiment?: Sentiment;
}
export interface CommentResponse {
    id: string;
    platformCommentId: string;
    text: string;
    authorName: string;
    publishedAt: string;
    likeCount: number;
    isFiltered: boolean;
    filterReason?: string;
    parentCommentId?: string;
    replyCount?: number;
    sentiment?: Sentiment;
    sentimentConfidence?: number;
}
export interface StartAnalysisRequest {
    postId: string;
    options?: AnalysisOptions;
}
export interface AnalysisOptions {
    includeSpamDetection?: boolean;
    includeToxicityFilter?: boolean;
    maxComments?: number;
    minCommentLength?: number;
    includeLanguages?: string[];
    includeReplies?: boolean;
    sentimentModel?: "standard" | "enhanced" | "multilingual";
}
export interface AnalysisJobResponse {
    id: string;
    postId: string;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
    progress: number;
    currentStep: number;
    totalSteps: number;
    stepDescription: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    estimatedCompletionAt?: string;
    analysisResultId?: string;
}
export interface AnalysisResultResponse {
    id: string;
    post: PostResponse;
    totalComments: number;
    filteredComments: number;
    summary: string;
    analyzedAt: string;
    sentimentBreakdown: SentimentBreakdownResponse;
    emotions: EmotionResponse[];
    themes: ThemeResponse[];
    keywords: KeywordResponse[];
    metadata: AnalysisMetadata;
}
export interface SentimentBreakdownResponse {
    positive: number;
    negative: number;
    neutral: number;
    confidenceScore: number;
    trend?: "improving" | "declining" | "stable";
    comparisonToAverage?: number;
}
export interface EmotionResponse {
    name: string;
    percentage: number;
    exampleComments?: string[];
    category: "positive" | "negative" | "neutral";
}
export interface ThemeResponse {
    name: string;
    frequency: number;
    sentiment: Sentiment;
    exampleComments: string[];
    relevanceScore: number;
    relatedKeywords: string[];
}
export interface KeywordResponse {
    word: string;
    frequency: number;
    sentiment: Sentiment;
    contexts: string[];
    importance: number;
    relatedWords: string[];
}
export interface AnalysisMetadata {
    modelVersion: string;
    processingTime: number;
    configuration: AnalysisOptions;
    qualityMetrics: {
        dataQuality: number;
        analysisConfidence: number;
        coverage: number;
    };
    languageDistribution: Record<string, number>;
}
export interface ExportAnalysisRequest {
    analysisId: string;
    format: "pdf" | "csv" | "json" | "xlsx" | "png" | "svg";
    options?: ExportOptions;
}
export interface ExportOptions {
    includeRawData?: boolean;
    includeCharts?: boolean;
    includeDetails?: boolean;
    branding?: {
        companyName?: string;
        logoUrl?: string;
        colors?: {
            primary: string;
            secondary: string;
        };
    };
    dateRange?: {
        start: string;
        end: string;
    };
}
export interface ExportResponse {
    exportId: string;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    format: string;
    createdAt: string;
    expiresAt: string;
}
export interface CompareAnalysesRequest {
    analysisIds: string[];
    options?: ComparisonOptions;
}
export interface ComparisonOptions {
    metrics?: ("sentiment" | "emotions" | "themes" | "keywords" | "engagement")[];
    includeTrends?: boolean;
    includeRecommendations?: boolean;
}
export interface ComparisonResponse {
    analyses: AnalysisResultResponse[];
    insights: ComparisonInsights;
    trends: TrendAnalysis;
    recommendations: string[];
}
export interface ComparisonInsights {
    bestPerforming: string;
    worstPerforming: string;
    averageSentiment: number;
    sentimentVariance: number;
    commonThemes: string[];
    uniqueThemes: Record<string, string[]>;
    engagementCorrelation: number;
}
export interface TrendAnalysis {
    sentimentTrend: "improving" | "declining" | "stable";
    engagementTrend: "increasing" | "decreasing" | "stable";
    confidence: number;
    drivers: string[];
    predictions?: {
        nextPeriodSentiment: number;
        predictionConfidence: number;
    };
}
export interface HealthCheckResponse {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    components: {
        database: ComponentHealth;
        cache: ComponentHealth;
        aiServices: ComponentHealth;
        socialMediaApis: Record<Platform, ComponentHealth>;
    };
    metrics: SystemMetrics;
}
export interface ComponentHealth {
    status: "healthy" | "degraded" | "unhealthy";
    responseTime?: number;
    error?: string;
    lastCheck: string;
}
export interface SystemMetrics {
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
    };
    requestRate: number;
    errorRate: number;
    activeJobs: number;
    queueDepth: number;
}
export interface FieldValidationError {
    field: string;
    message: string;
    rule: string;
    rejectedValue: any;
}
export interface ValidationResult {
    isValid: boolean;
    fieldErrors: FieldValidationError[];
    messages: string[];
}
export interface WebhookEvent {
    type: "analysis.completed" | "analysis.failed" | "platform.connected" | "platform.disconnected";
    timestamp: string;
    data: Record<string, any>;
    eventId: string;
    userId: string;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    webhook: boolean;
    types: ("analysis.completed" | "analysis.failed" | "weekly.summary")[];
}
export type { Platform, Sentiment, User, Post, AnalysisResult, ConnectedPlatform };
//# sourceMappingURL=api.d.ts.map