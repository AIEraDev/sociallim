import { User, ConnectedPlatform, Post, Comment, AnalysisResult, SentimentBreakdown, Emotion, Theme, Keyword, Platform, Sentiment } from "@prisma/client";

// Extended types with relations for common use cases
export type UserWithPlatforms = User & {
  connectedPlatforms: ConnectedPlatform[];
};

export type UserWithPostsAndAnalysis = User & {
  posts: Post[];
  analysisResults: AnalysisResult[];
};

export type PostWithComments = Post & {
  comments: Comment[];
  user: User;
};

export type PostWithAnalysis = Post & {
  comments: Comment[];
  analysisResults: AnalysisResult[];
  user: User;
};

export type AnalysisResultWithDetails = AnalysisResult & {
  sentimentBreakdown: SentimentBreakdown | null;
  emotions: Emotion[];
  themes: Theme[];
  keywords: Keyword[];
  post: Post;
  user: User;
};

export type AnalysisResultWithPost = AnalysisResult & {
  post: PostWithComments;
  sentimentBreakdown: SentimentBreakdown | null;
  emotions: Emotion[];
  themes: Theme[];
  keywords: Keyword[];
};

export type CommentWithPost = Comment & {
  post: Post;
};

export type ConnectedPlatformWithUser = ConnectedPlatform & {
  user: User;
};

// Export base types for convenience
export { User, ConnectedPlatform, Post, Comment, AnalysisResult, SentimentBreakdown, Emotion, Theme, Keyword, Platform, Sentiment };

// Utility types for API responses
export type CreateUserData = Pick<User, "email">;
export type UpdateUserData = Partial<Pick<User, "email">>;

export type CreatePostData = Pick<Post, "platform" | "platformPostId" | "title" | "url" | "publishedAt" | "userId">;
export type UpdatePostData = Partial<Pick<Post, "title" | "url">>;

export type CreateCommentData = Pick<Comment, "platformCommentId" | "text" | "authorName" | "publishedAt" | "likeCount" | "postId">;

export type CreateAnalysisResultData = Pick<AnalysisResult, "totalComments" | "filteredComments" | "summary" | "postId" | "userId">;

export type CreateConnectedPlatformData = Pick<ConnectedPlatform, "platform" | "platformUserId" | "accessToken" | "refreshToken" | "tokenExpiresAt" | "userId">;
export type UpdateConnectedPlatformData = Partial<Pick<ConnectedPlatform, "accessToken" | "refreshToken" | "tokenExpiresAt">>;

// Query filter types
export type PostFilters = {
  platform?: Platform;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AnalysisFilters = {
  userId?: string;
  platform?: Platform;
  dateFrom?: Date;
  dateTo?: Date;
};

export type CommentFilters = {
  postId?: string;
  isFiltered?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
};
