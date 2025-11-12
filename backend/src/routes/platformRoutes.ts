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
  source: Joi.string().valid("db", "live").default("db").messages({
    "any.only": "Source must be 'db' (database) or 'live' (fetch fresh from social platform).",
  }),
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
 * GET /platforms/
 * Fetch user connected platforms
 */
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    const userConnections = await oauthService.getUserConnections(userId);

    res.status(200).json({
      message: "Connected platforms fetched successfully",
      data: userConnections,
    });
  } catch (error) {
    console.error("Error fetching connected platforms:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while fetching connected platforms",
    });
  }
});

/**
 * GET /platforms/:platform/posts
 * Fetch user posts from a specific platform
 * Query params:
 * - source: 'api' (fetch from social platform) or 'db' (fetch from database) - default: 'db'
 * - limit: number of posts to fetch (1-50) - default: 20
 * - pageToken: pagination token for API requests
 */
router.get("/:platform/posts", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Validate platform parameter
    const { error: platformError } = platformParamSchema.validate(req.params);
    if (platformError) {
      res.status(400).json({
        error: "Invalid platform",
        message: platformError.details[0].message,
      });
      return;
    }

    // Validate query parameters
    const { error: queryError, value } = fetchPostsSchema.validate(req.query);
    if (queryError) {
      res.status(400).json({
        error: "Invalid query parameters",
        message: queryError.details[0].message,
      });
      return;
    }

    const { limit, pageToken, source } = value;
    const userId = req.user.id;
    const platform = req.params.platform.toUpperCase() as Platform;

    // If fetching from database
    if (source === "db") {
      const posts = await prisma.post.findMany({
        where: {
          userId,
          platform,
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: limit,
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      const formattedPosts = posts.map((post) => ({
        id: post.platformPostId,
        title: post.title,
        url: post.url,
        publishedAt: post.publishedAt,
        platform: post.platform,
        hasComments: post._count.comments > 0,
        commentsCount: post._count.comments,
      }));

      res.status(200).json({
        message: "Posts fetched from database successfully",
        data: {
          posts: formattedPosts,
          source: "database",
          platform,
          totalPosts: formattedPosts.length,
        },
      });
      return;
    }

    // If fetching from API, check OAuth connection
    const oauthConnection = await oauthService.getConnection(userId, platform);

    if (!oauthConnection) {
      res.status(400).json({
        error: "Platform not connected",
        message: `Please connect your ${platform} account first`,
      });
      return;
    }

    // Check if token is valid and refresh if needed
    const isTokenValid = await oauthService.validateToken(userId, platform);
    if (!isTokenValid) {
      try {
        await oauthService.refreshToken(userId, platform);
        const refreshedConnection = await oauthService.getConnection(userId, platform);
        if (!refreshedConnection) {
          throw new Error("Failed to refresh token");
        }
        oauthConnection.accessToken = refreshedConnection.accessToken;
      } catch (refreshError) {
        res.status(401).json({
          error: "Token expired",
          message: "OAuth token expired and refresh failed. Please reconnect your account.",
        });
        return;
      }
    }

    // Get social media service for this platform
    const service = socialMediaServiceFactory.getService(platform);

    // Fetch posts from the platform API
    const result = await service.fetchUserPosts(oauthConnection.accessToken, {
      limit,
      pageToken,
    });

    // Store new posts in database
    const storedPosts = [];
    for (const post of result.posts) {
      try {
        // Check if post already exists
        const existingPost = await prisma.post.findUnique({
          where: {
            platform_platformPostId: {
              platform,
              platformPostId: post.id,
            },
          },
        });

        if (!existingPost) {
          let postUrl: string = post.url;

          // If no URL provided, fetch user info once and generate URL
          if (!postUrl) {
            try {
              const userInfo = await socialMediaServiceFactory.getService(platform).fetchUserInfo(oauthConnection.accessToken);
              const username = userInfo.username || userInfo.display_name || userInfo.open_id || "user";
              postUrl = `https://www.tiktok.com/@${username}/video/${post.id}`;
              console.log("Generated URL with username:", postUrl);
            } catch (userInfoError) {
              // Fallback if user info fetch fails
              console.warn("Failed to fetch user info for URL generation:", userInfoError);
              postUrl = `https://www.tiktok.com/@user/video/${post.id}`;
            }
          }

          // Create new post record
          await prisma.post.create({
            data: {
              platform,
              platformPostId: post.id,
              title: post.title || "Untitled Post",
              url: postUrl,
              publishedAt: post.publishedAt,
              userId,
            },
          });
        }

        storedPosts.push({
          ...post,
          platform,
          hasComments: true, // We'll determine this based on actual data later
        });
      } catch (dbError) {
        console.warn(`Failed to store post ${post.id} in database:`, dbError);
        // Still include in response even if DB storage fails
        storedPosts.push({
          ...post,
          platform,
          hasComments: true,
        });
      }
    }

    res.status(200).json({
      message: "Posts fetched from platform API successfully",
      data: {
        posts: storedPosts,
        source: "live",
        platform,
        totalPosts: storedPosts.length,
        pagination: result.pagination,
      },
    });
  } catch (error: any) {
    console.error(`Error fetching posts from ${req.params.platform}:`, error);
    res.status(500).json({
      error: "Failed to fetch posts",
      message: `An error occurred while fetching posts from ${req.params.platform}`,
    });
  }
});

/**
 * GET /platforms/posts
 * Fetch user posts from all connected platforms (legacy endpoint)
 */
// router.get("/posts", authenticateToken, async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         error: "Unauthorized",
//         message: "User not authenticated",
//       });
//       return;
//     }

//     const { error, value } = fetchPostsSchema.validate(req.query);
//     if (error) {
//       res.status(400).json({
//         error: "Invalid query parameters",
//         message: error.details[0].message,
//       });
//       return;
//     }

//     const { limit, source } = value;
//     const userId = req.user.id;

//     if (source === "db") {
//       // Fetch from database for all platforms
//       const posts = await prisma.post.findMany({
//         where: { userId },
//         orderBy: { publishedAt: "desc" },
//         take: limit,
//         include: {
//           _count: {
//             select: { comments: true },
//           },
//         },
//       });

//       const formattedPosts = posts.map((post) => ({
//         id: post.platformPostId,
//         title: post.title,
//         url: post.url,
//         publishedAt: post.publishedAt,
//         platform: post.platform,
//         hasComments: post._count.comments > 0,
//         commentsCount: post._count.comments,
//       }));

//       res.status(200).json({
//         message: "Posts fetched from database successfully",
//         data: {
//           posts: formattedPosts,
//           source: "database",
//           totalPosts: formattedPosts.length,
//         },
//       });
//       return;
//     }

//     // For API source, redirect to use platform-specific endpoints
//     res.status(400).json({
//       error: "Invalid request",
//       message: "To fetch from API, please use platform-specific endpoints: /platforms/{platform}/posts?source=api",
//     });
//   } catch (error: any) {
//     console.error("Fetch posts error:", error);
//     res.status(500).json({
//       error: "Failed to fetch posts",
//       message: "An error occurred while fetching posts",
//     });
//   }
// });

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

/**
 * GET /platforms/:platform/user
 * Get user information from a specific platform
 */
router.get("/:platform/user", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Validate platform parameter
    const { error: platformError } = platformParamSchema.validate(req.params);
    if (platformError) {
      res.status(400).json({
        error: "Invalid platform",
        message: platformError.details[0].message,
      });
      return;
    }

    const userId = req.user.id;
    const platform = req.params.platform.toUpperCase() as Platform;

    // Check OAuth connection
    const oauthConnection = await oauthService.getConnection(userId, platform);

    if (!oauthConnection) {
      res.status(400).json({
        error: "Platform not connected",
        message: `Please connect your ${platform} account first`,
      });
      return;
    }

    // Check if token is valid and refresh if needed
    const isTokenValid = await oauthService.validateToken(userId, platform);
    if (!isTokenValid) {
      try {
        await oauthService.refreshToken(userId, platform);
        const refreshedConnection = await oauthService.getConnection(userId, platform);
        if (!refreshedConnection) {
          throw new Error("Failed to refresh token");
        }
        oauthConnection.accessToken = refreshedConnection.accessToken;
      } catch (refreshError) {
        res.status(401).json({
          error: "Token expired",
          message: "OAuth token expired and refresh failed. Please reconnect your account.",
        });
        return;
      }
    }

    // Get social media service for this platform
    const service = socialMediaServiceFactory.getService(platform);

    // Fetch user info from the platform
    const userInfo = await service.fetchUserInfo(oauthConnection.accessToken);

    res.status(200).json({
      message: "User info fetched successfully",
      data: {
        userInfo,
        platform,
      },
    });
  } catch (error: any) {
    console.error(`Error fetching user info from ${req.params.platform}:`, error);
    res.status(500).json({
      error: "Failed to fetch user info",
      message: `An error occurred while fetching user info from ${req.params.platform}`,
    });
  }
});

export default router;
