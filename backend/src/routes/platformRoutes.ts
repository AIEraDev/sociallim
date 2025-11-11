import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { oauthService } from "../services/oauthService";
import { socialMediaServiceFactory } from "../services/socialMedia/socialMediaServiceFactory";
import { analysisOrchestrationService, jobManager } from "../services";
import { Platform } from "@prisma/client";
import { prisma } from "../config/database";
import Joi from "joi";

const router = Router();

/**
 * Validation schemas
 */
const platformParamSchema = Joi.object({
  platform: Joi.string()
    .valid(...Object.values(Platform).map((p) => p.toLowerCase()))
    .required()
    .messages({
      "any.only": "Platform must be one of: youtube, instagram, twitter, tiktok",
      "any.required": "Platform parameter is required",
    }),
});

const fetchPostsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
  pageToken: Joi.string().optional(),
});

const startAnalysisSchema = Joi.object({
  postId: Joi.string().required().messages({
    "any.required": "Post ID is required",
  }),
});

/**
 * Middleware to validate platform parameter
 */
const validatePlatform = (req: Request, res: Response, next: any): void => {
  const { error } = platformParamSchema.validate(req.params);
  if (error) {
    res.status(400).json({
      error: "Invalid platform",
      message: error.details[0].message,
    });
    return;
  }
  next();
};

/**
 * GET /platforms/connect/:platform
 * Initiate OAuth connection for a platform
 */
router.get("/connect/:platform", authenticateToken, validatePlatform, (req: Request, res: Response): void => {
  try {
    const { platform } = req.params;
    const platformUpper = platform.toUpperCase() as Platform;

    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Check if platform is supported
    if (!socialMediaServiceFactory.isPlatformSupported(platformUpper)) {
      res.status(400).json({
        error: "Unsupported platform",
        message: `Platform ${platform} is not supported`,
      });
      return;
    }

    // Generate OAuth URL (this would typically redirect to OAuth provider)
    const oauthUrl = `/api/oauth/connect/${platform}`;

    res.status(200).json({
      message: `OAuth initiation for ${platform}`,
      data: {
        platform,
        oauthUrl,
        redirectUrl: `${process.env.FRONTEND_URL}/dashboard?connecting=${platform}`,
      },
    });
  } catch (error: any) {
    console.error("Platform connection error:", error);
    res.status(500).json({
      error: "Connection failed",
      message: "Failed to initiate platform connection",
    });
  }
});

/**
 * GET /platforms/posts
 * Fetch user posts from connected platforms
 */
router.get("/posts", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { error, value } = fetchPostsSchema.validate(req.query);
    if (error) {
      res.status(400).json({
        error: "Invalid query parameters",
        message: error.details[0].message,
      });
      return;
    }

    const { limit, pageToken } = value;
    const userId = req.user.id;

    // Get user's connected platforms
    const connections = await oauthService.getUserConnections(userId);

    if (connections.length === 0) {
      res.status(200).json({
        message: "No connected platforms found",
        data: {
          posts: [],
          platforms: [],
        },
      });
      return;
    }

    const allPosts: any[] = [];
    const platformStatuses: any[] = [];

    // Fetch posts from each connected platform
    for (const connection of connections) {
      try {
        // Get OAuth connection with decrypted tokens
        const oauthConnection = await oauthService.getConnection(userId, connection.platform);

        if (!oauthConnection) {
          platformStatuses.push({
            platform: connection.platform,
            status: "disconnected",
            error: "OAuth connection not found",
          });
          continue;
        }

        // Check if token is valid
        const isTokenValid = await oauthService.validateToken(userId, connection.platform);
        if (!isTokenValid) {
          // Try to refresh token
          try {
            await oauthService.refreshToken(userId, connection.platform);
            const refreshedConnection = await oauthService.getConnection(userId, connection.platform);
            if (!refreshedConnection) {
              throw new Error("Failed to refresh token");
            }
            oauthConnection.accessToken = refreshedConnection.accessToken;
          } catch (refreshError) {
            platformStatuses.push({
              platform: connection.platform,
              status: "token_expired",
              error: "Token expired and refresh failed",
            });
            continue;
          }
        }

        // Get social media service for this platform
        const service = socialMediaServiceFactory.getService(connection.platform);

        // Fetch posts from the platform
        const result = await service.fetchUserPosts(oauthConnection.accessToken, {
          limit,
          pageToken,
        });

        // Store posts in database and add to response
        for (const post of result.posts) {
          // Check if post already exists
          const existingPost = await prisma.post.findUnique({
            where: {
              platform_platformPostId: {
                platform: connection.platform,
                platformPostId: post.id,
              },
            },
          });

          if (!existingPost) {
            // Create new post record
            await prisma.post.create({
              data: {
                platform: connection.platform,
                platformPostId: post.id,
                title: post.title,
                url: post.url,
                publishedAt: post.publishedAt,
                userId,
              },
            });
          }

          allPosts.push({
            ...post,
            platform: connection.platform,
            hasComments: true, // We'll check this later if needed
          });
        }

        platformStatuses.push({
          platform: connection.platform,
          status: "connected",
          postsCount: result.posts.length,
          pagination: result.pagination,
        });
      } catch (platformError: any) {
        console.error(`Error fetching posts from ${connection.platform}:`, platformError);
        platformStatuses.push({
          platform: connection.platform,
          status: "error",
          error: platformError.message,
        });
      }
    }

    // Sort posts by published date (newest first)
    allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.status(200).json({
      message: "Posts fetched successfully",
      data: {
        posts: allPosts.slice(0, limit), // Apply limit to combined results
        platforms: platformStatuses,
        totalPosts: allPosts.length,
      },
    });
  } catch (error: any) {
    console.error("Fetch posts error:", error);
    res.status(500).json({
      error: "Failed to fetch posts",
      message: "An error occurred while fetching posts from connected platforms",
    });
  }
});

/**
 * POST /analysis/start
 * Initiate comment analysis for a post
 */
router.post("/analysis/start", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { error, value } = startAnalysisSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: "Invalid request body",
        message: error.details[0].message,
      });
      return;
    }

    const { postId } = value;
    const userId = req.user.id;

    // Validate analysis prerequisites
    const validation = await analysisOrchestrationService.validateAnalysisPrerequisites(postId, userId);
    if (!validation.valid) {
      res.status(400).json({
        error: "Analysis prerequisites not met",
        message: "Cannot start analysis for this post",
        details: validation.errors,
      });
      return;
    }

    // Check if there's already a running analysis for this post
    const existingJob = await prisma.analysisJob.findFirst({
      where: {
        postId,
        userId,
        status: { in: ["PENDING", "RUNNING"] },
      },
    });

    if (existingJob) {
      res.status(409).json({
        error: "Analysis already in progress",
        message: "There is already an analysis running for this post",
        data: {
          jobId: existingJob.id,
          status: existingJob.status,
          progress: existingJob.progress,
        },
      });
      return;
    }

    // Get the post and its comments
    const post = await prisma.post.findFirst({
      where: { id: postId, userId },
      include: { comments: true },
    });

    if (!post) {
      res.status(404).json({
        error: "Post not found",
        message: "Post not found or access denied",
      });
      return;
    }

    // If post has no comments, fetch them from the platform first
    if (post.comments.length === 0) {
      try {
        await fetchCommentsForPost(post, userId);
        // Refresh post data with comments
        const updatedPost = await prisma.post.findFirst({
          where: { id: postId },
          include: { comments: true },
        });
        if (updatedPost) {
          post.comments = updatedPost.comments;
        }
      } catch (fetchError: any) {
        res.status(500).json({
          error: "Failed to fetch comments",
          message: "Could not fetch comments from the platform",
          details: fetchError.message,
        });
        return;
      }
    }

    // Create analysis job
    const job = await jobManager.createJob(postId, userId, post.comments.length);

    // Start analysis in background
    const commentIds = post.comments.map((c) => c.id);
    analysisOrchestrationService.processAnalysis(job.id, postId, userId, commentIds).catch((error) => {
      console.error(`Background analysis failed for job ${job.id}:`, error);
    });

    res.status(202).json({
      message: "Analysis started successfully",
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        estimatedTime: analysisOrchestrationService.estimateAnalysisTime(post.comments.length),
        totalComments: post.comments.length,
      },
    });
  } catch (error: any) {
    console.error("Start analysis error:", error);
    res.status(500).json({
      error: "Failed to start analysis",
      message: "An error occurred while starting the analysis",
    });
  }
});

/**
 * GET /analysis/:id/status
 * Get analysis job status and progress
 */
router.get("/analysis/:id/status", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { id: jobId } = req.params;
    const userId = req.user.id;

    // Get job status
    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            platform: true,
          },
        },
        analysisResult: {
          select: {
            id: true,
            analyzedAt: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({
        error: "Job not found",
        message: "Analysis job not found or access denied",
      });
      return;
    }

    res.status(200).json({
      message: "Job status retrieved successfully",
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        totalSteps: job.totalSteps,
        stepDescription: job.stepDescription,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        post: job.post,
        hasResults: !!job.analysisResult,
        resultsId: job.analysisResult?.id,
      },
    });
  } catch (error: any) {
    console.error("Get job status error:", error);
    res.status(500).json({
      error: "Failed to get job status",
      message: "An error occurred while retrieving job status",
    });
  }
});

/**
 * Helper function to fetch comments for a post from the platform
 */
async function fetchCommentsForPost(post: any, userId: string): Promise<void> {
  // Get OAuth connection for the platform
  const oauthConnection = await oauthService.getConnection(userId, post.platform);
  if (!oauthConnection) {
    throw new Error("OAuth connection not found for platform");
  }

  // Validate token
  const isTokenValid = await oauthService.validateToken(userId, post.platform);
  if (!isTokenValid) {
    // Try to refresh token
    await oauthService.refreshToken(userId, post.platform);
    const refreshedConnection = await oauthService.getConnection(userId, post.platform);
    if (!refreshedConnection) {
      throw new Error("Failed to refresh token");
    }
    oauthConnection.accessToken = refreshedConnection.accessToken;
  }

  // Get social media service
  const service = socialMediaServiceFactory.getService(post.platform);

  // Fetch comments
  const result = await service.fetchPostComments(oauthConnection.accessToken, post.platformPostId, {
    limit: 1000, // Fetch up to 1000 comments
  });

  // Store comments in database
  const commentsToCreate = result.comments.map((comment) => ({
    platformCommentId: comment.id,
    text: comment.text,
    authorName: comment.authorName,
    publishedAt: comment.publishedAt,
    likeCount: comment.likeCount,
    postId: post.id,
  }));

  if (commentsToCreate.length > 0) {
    await prisma.comment.createMany({
      data: commentsToCreate,
      skipDuplicates: true,
    });
  }
}

export default router;
