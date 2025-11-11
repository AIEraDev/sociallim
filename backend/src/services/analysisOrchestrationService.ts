import { PrismaClient, JobStatus } from "@prisma/client";
import { JobManager, JobProgress } from "./jobManager";
import { CommentPreprocessor } from "./ai/commentPreprocessor";
import { SentimentAnalyzer } from "./ai/sentimentAnalyzer";
import { ThemeAnalyzer } from "./ai/themeAnalyzer";
import { SummaryGenerator } from "./ai/summaryGenerator";
import { logger } from "../utils/logger";

export interface AnalysisStep {
  name: string;
  description: string;
  weight: number; // Relative weight for progress calculation
}

/**
 * Analysis Orchestration Service
 *
 * Coordinates the complete sentiment analysis pipeline for social media comments.
 * Manages the multi-step analysis process including preprocessing, sentiment analysis,
 * theme extraction, and summary generation with progress tracking and caching.
 *
 * @class AnalysisOrchestrationService
 * @description Main orchestrator for comment sentiment analysis workflow.
 *
 * Analysis Pipeline:
 * 1. **Preprocessing** (20%): Comment cleaning, spam detection, toxicity filtering
 * 2. **Sentiment Analysis** (30%): AI-powered sentiment classification and emotion detection
 * 3. **Theme Analysis** (30%): Semantic clustering and keyword extraction
 * 4. **Summary Generation** (15%): AI-generated insights and summaries
 * 5. **Data Persistence** (5%): Saving results to database with transactions
 *
 * Features:
 * - Progress tracking with real-time updates
 * - Result caching to avoid duplicate processing
 * - Atomic database transactions for data consistency
 * - Comprehensive error handling and retry logic
 * - Performance monitoring and metrics collection
 *
 * @example
 * ```typescript
 * const orchestrator = new AnalysisOrchestrationService(prisma, jobManager);
 *
 * // Start analysis for a post
 * await orchestrator.processAnalysis(
 *   'job_123',
 *   'post_456',
 *   'user_789',
 *   ['comment1', 'comment2', 'comment3']
 * );
 *
 * // Check prerequisites before analysis
 * const validation = await orchestrator.validateAnalysisPrerequisites(
 *   'post_456',
 *   'user_789'
 * );
 * ```
 */
export class AnalysisOrchestrationService {
  /** Prisma client for database operations */
  private prisma: PrismaClient;

  /** Job manager for background task coordination */
  private jobManager: JobManager;

  /** Comment preprocessing service for cleaning and filtering */
  private commentPreprocessor: CommentPreprocessor;

  /** AI service for sentiment analysis */
  private sentimentAnalyzer: SentimentAnalyzer;

  /** AI service for theme and keyword extraction */
  private themeAnalyzer: ThemeAnalyzer;

  /** AI service for summary generation */
  private summaryGenerator: SummaryGenerator;

  private readonly analysisSteps: AnalysisStep[] = [
    { name: "preprocessing", description: "Preprocessing comments and filtering spam", weight: 0.2 },
    { name: "sentiment", description: "Analyzing sentiment and emotions", weight: 0.3 },
    { name: "themes", description: "Extracting themes and keywords", weight: 0.3 },
    { name: "summary", description: "Generating summary and insights", weight: 0.15 },
    { name: "saving", description: "Saving results to database", weight: 0.05 },
  ];

  constructor(prisma: PrismaClient, jobManager: JobManager) {
    this.prisma = prisma;
    this.jobManager = jobManager;
    this.commentPreprocessor = new CommentPreprocessor();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.themeAnalyzer = new ThemeAnalyzer();
    this.summaryGenerator = new SummaryGenerator();
  }

  /**
   * Execute complete sentiment analysis pipeline
   *
   * Orchestrates the full analysis workflow from comment preprocessing to result storage.
   * Handles progress tracking, caching, error recovery, and atomic data persistence.
   *
   * @param jobId - Unique identifier for the analysis job
   * @param postId - ID of the post being analyzed
   * @param userId - ID of the user requesting analysis
   * @param commentIds - Array of comment IDs to analyze
   *
   * @returns Promise that resolves when analysis is complete
   *
   * @throws {Error} When analysis fails at any step
   *
   * @example
   * ```typescript
   * try {
   *   await orchestrator.processAnalysis(
   *     'job_abc123',
   *     'post_xyz789',
   *     'user_def456',
   *     ['comment1', 'comment2', 'comment3']
   *   );
   *   console.log('Analysis completed successfully');
   * } catch (error) {
   *   console.error('Analysis failed:', error.message);
   * }
   * ```
   */
  async processAnalysis(jobId: string, postId: string, userId: string, commentIds: string[]): Promise<void> {
    try {
      logger.info(`Starting analysis orchestration for job ${jobId}`);

      // Check if analysis already exists (caching)
      const existingResult = await this.checkExistingAnalysis(postId);
      if (existingResult) {
        await this.handleCachedResult(jobId, existingResult);
        return;
      }

      // Fetch comments from database
      const comments = await this.fetchComments(commentIds);
      if (comments.length === 0) {
        throw new Error("No comments found for analysis");
      }

      let currentProgress = 0;
      let stepIndex = 0;

      // Step 1: Preprocessing
      await this.updateProgress(jobId, stepIndex, "Preprocessing comments and filtering spam");
      const preprocessedComments = await this.commentPreprocessor.preprocessComments(comments);
      currentProgress += this.analysisSteps[stepIndex].weight;
      stepIndex++;

      // Step 2: Sentiment Analysis
      await this.updateProgress(jobId, stepIndex, "Analyzing sentiment and emotions");
      const sentimentResults = await this.sentimentAnalyzer.analyzeBatchSentiment(preprocessedComments.filteredComments);
      currentProgress += this.analysisSteps[stepIndex].weight;
      stepIndex++;

      // Step 3: Theme and Keyword Analysis
      await this.updateProgress(jobId, stepIndex, "Extracting themes and keywords");
      const themeResults = await this.themeAnalyzer.analyzeThemes(preprocessedComments.filteredComments, sentimentResults.results);
      currentProgress += this.analysisSteps[stepIndex].weight;
      stepIndex++;

      // Step 4: Summary Generation
      await this.updateProgress(jobId, stepIndex, "Generating summary and insights");
      const summary = await this.summaryGenerator.generateSummary({
        sentimentBreakdown: sentimentResults.summary.sentimentDistribution,
        themes: themeResults.themes,
        keywords: themeResults.keywords,
        totalComments: comments.length,
        filteredComments: preprocessedComments.spamComments.length + preprocessedComments.toxicComments.length,
      });
      currentProgress += this.analysisSteps[stepIndex].weight;
      stepIndex++;

      // Step 5: Save Results
      await this.updateProgress(jobId, stepIndex, "Saving results to database");
      await this.saveAnalysisResults(jobId, postId, userId, {
        totalComments: comments.length,
        filteredComments: preprocessedComments.spamComments.length + preprocessedComments.toxicComments.length,
        summary: summary.summary,
        sentimentResults,
        themeResults,
        emotions: summary.emotions,
        keywords: themeResults.keywords,
      });

      // Mark job as completed
      await this.jobManager.updateJobProgress(jobId, { progress: 100, currentStep: this.analysisSteps.length, stepDescription: "Analysis completed" }, JobStatus.COMPLETED);

      logger.info(`Analysis orchestration completed for job ${jobId}`);
    } catch (error) {
      logger.error(`Analysis orchestration failed for job ${jobId}:`, error);
      await this.jobManager.markJobFailed(jobId, error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }

  /**
   * Check if analysis already exists for this post (caching)
   */
  private async checkExistingAnalysis(postId: string) {
    try {
      const existingResult = await this.prisma.analysisResult.findFirst({
        where: { postId },
        include: {
          sentimentBreakdown: true,
          emotions: true,
          themes: true,
          keywords: true,
        },
        orderBy: { analyzedAt: "desc" },
      });

      // Check if the result is recent (within last 24 hours)
      if (existingResult) {
        const hoursSinceAnalysis = (Date.now() - existingResult.analyzedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAnalysis < 24) {
          logger.info(`Found recent analysis for post ${postId}, using cached result`);
          return existingResult;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error checking existing analysis for post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Handle cached analysis result
   */
  private async handleCachedResult(jobId: string, existingResult: any): Promise<void> {
    try {
      // Link the existing result to this job
      await this.prisma.analysisResult.update({
        where: { id: existingResult.id },
        data: { jobId },
      });

      // Mark job as completed immediately
      await this.jobManager.updateJobProgress(
        jobId,
        {
          progress: 100,
          currentStep: this.analysisSteps.length,
          stepDescription: "Used cached analysis result",
        },
        JobStatus.COMPLETED
      );

      logger.info(`Used cached analysis result for job ${jobId}`);
    } catch (error) {
      logger.error(`Error handling cached result for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch comments from database
   */
  private async fetchComments(commentIds: string[]) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: {
          id: { in: commentIds },
          isFiltered: false, // Only get non-filtered comments
        },
        orderBy: { publishedAt: "desc" },
      });

      return comments;
    } catch (error) {
      logger.error("Error fetching comments:", error);
      throw new Error("Failed to fetch comments for analysis");
    }
  }

  /**
   * Update job progress
   */
  private async updateProgress(jobId: string, stepIndex: number, description: string): Promise<void> {
    const progress = this.calculateProgress(stepIndex);
    await this.jobManager.updateJobProgress(jobId, {
      progress,
      currentStep: stepIndex + 1,
      stepDescription: description,
    });
  }

  /**
   * Calculate progress percentage based on completed steps
   */
  private calculateProgress(completedStepIndex: number): number {
    let totalWeight = 0;
    for (let i = 0; i < completedStepIndex; i++) {
      totalWeight += this.analysisSteps[i].weight;
    }
    return Math.round(totalWeight * 100);
  }

  /**
   * Save analysis results to database using Prisma transaction
   */
  private async saveAnalysisResults(
    jobId: string,
    postId: string,
    userId: string,
    results: {
      totalComments: number;
      filteredComments: number;
      summary: string;
      sentimentResults: any;
      themeResults: any;
      emotions: any[];
      keywords: any[];
    }
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create analysis result
        const analysisResult = await tx.analysisResult.create({
          data: {
            jobId,
            postId,
            userId,
            totalComments: results.totalComments,
            filteredComments: results.filteredComments,
            summary: results.summary,
          },
        });

        // Create sentiment breakdown
        if (results.sentimentResults.breakdown) {
          await tx.sentimentBreakdown.create({
            data: {
              analysisResultId: analysisResult.id,
              positive: results.sentimentResults.breakdown.positive,
              negative: results.sentimentResults.breakdown.negative,
              neutral: results.sentimentResults.breakdown.neutral,
              confidenceScore: results.sentimentResults.confidenceScore || 0.8,
            },
          });
        }

        // Create emotions
        if (results.emotions && results.emotions.length > 0) {
          await tx.emotion.createMany({
            data: results.emotions.map((emotion) => ({
              analysisResultId: analysisResult.id,
              name: emotion.name,
              percentage: emotion.percentage,
            })),
          });
        }

        // Create themes
        if (results.themeResults.themes && results.themeResults.themes.length > 0) {
          await tx.theme.createMany({
            data: results.themeResults.themes.map((theme: any) => ({
              analysisResultId: analysisResult.id,
              name: theme.name,
              frequency: theme.frequency,
              sentiment: theme.sentiment,
              exampleComments: theme.exampleComments || [],
            })),
          });
        }

        // Create keywords
        if (results.keywords && results.keywords.length > 0) {
          await tx.keyword.createMany({
            data: results.keywords.map((keyword: any) => ({
              analysisResultId: analysisResult.id,
              word: keyword.word,
              frequency: keyword.frequency,
              sentiment: keyword.sentiment,
              contexts: keyword.contexts || [],
            })),
          });
        }

        logger.info(`Saved analysis results for job ${jobId}`);
      });
    } catch (error) {
      logger.error(`Error saving analysis results for job ${jobId}:`, error);
      throw new Error("Failed to save analysis results");
    }
  }

  /**
   * Get analysis pipeline status for monitoring
   */
  async getAnalysisPipelineStatus(): Promise<{
    steps: AnalysisStep[];
    totalSteps: number;
  }> {
    return {
      steps: this.analysisSteps,
      totalSteps: this.analysisSteps.length,
    };
  }

  /**
   * Estimate analysis time based on comment count
   */
  estimateAnalysisTime(commentCount: number): number {
    // Base time: 10 seconds
    // Additional time: 0.1 seconds per comment
    // Maximum time: 5 minutes
    const baseTime = 10;
    const timePerComment = 0.1;
    const maxTime = 300;

    const estimatedTime = baseTime + commentCount * timePerComment;
    return Math.min(estimatedTime, maxTime);
  }

  /**
   * Validate analysis prerequisites
   */
  async validateAnalysisPrerequisites(
    postId: string,
    userId: string
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if post exists and belongs to user
      const post = await this.prisma.post.findFirst({
        where: { id: postId, userId },
        include: { comments: true },
      });

      if (!post) {
        errors.push("Post not found or access denied");
      } else {
        // Check if post has comments
        if (post.comments.length === 0) {
          errors.push("Post has no comments to analyze");
        }

        // Check if there are enough non-filtered comments
        const validComments = post.comments.filter((c) => !c.isFiltered);
        if (validComments.length < 5) {
          errors.push("Post needs at least 5 valid comments for meaningful analysis");
        }
      }

      // Check if user has connected platforms
      const connectedPlatforms = await this.prisma.connectedPlatform.findMany({
        where: { userId },
      });

      if (connectedPlatforms.length === 0) {
        errors.push("User has no connected social media platforms");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating analysis prerequisites:", error);
      return {
        valid: false,
        errors: ["Failed to validate analysis prerequisites"],
      };
    }
  }
}
