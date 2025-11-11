"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const oauthService_1 = require("../services/oauthService");
const socialMediaServiceFactory_1 = require("../services/socialMedia/socialMediaServiceFactory");
const services_1 = require("../services");
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const platformParamSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid(...Object.values(client_1.Platform).map((p) => p.toLowerCase()))
        .required()
        .messages({
        "any.only": "Platform must be one of: youtube, instagram, twitter, tiktok",
        "any.required": "Platform parameter is required",
    }),
});
const fetchPostsSchema = joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(50).default(20).messages({
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 50",
    }),
    pageToken: joi_1.default.string().optional(),
});
const startAnalysisSchema = joi_1.default.object({
    postId: joi_1.default.string().required().messages({
        "any.required": "Post ID is required",
    }),
});
const validatePlatform = (req, res, next) => {
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
router.get("/connect/:platform", authMiddleware_1.authenticateToken, validatePlatform, (req, res) => {
    try {
        const { platform } = req.params;
        const platformUpper = platform.toUpperCase();
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        if (!socialMediaServiceFactory_1.socialMediaServiceFactory.isPlatformSupported(platformUpper)) {
            res.status(400).json({
                error: "Unsupported platform",
                message: `Platform ${platform} is not supported`,
            });
            return;
        }
        const oauthUrl = `/api/oauth/connect/${platform}`;
        res.status(200).json({
            message: `OAuth initiation for ${platform}`,
            data: {
                platform,
                oauthUrl,
                redirectUrl: `${process.env.FRONTEND_URL}/dashboard?connecting=${platform}`,
            },
        });
    }
    catch (error) {
        console.error("Platform connection error:", error);
        res.status(500).json({
            error: "Connection failed",
            message: "Failed to initiate platform connection",
        });
    }
});
router.get("/posts", authMiddleware_1.authenticateToken, async (req, res) => {
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
        const connections = await oauthService_1.oauthService.getUserConnections(userId);
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
        const allPosts = [];
        const platformStatuses = [];
        for (const connection of connections) {
            try {
                const oauthConnection = await oauthService_1.oauthService.getConnection(userId, connection.platform);
                if (!oauthConnection) {
                    platformStatuses.push({
                        platform: connection.platform,
                        status: "disconnected",
                        error: "OAuth connection not found",
                    });
                    continue;
                }
                const isTokenValid = await oauthService_1.oauthService.validateToken(userId, connection.platform);
                if (!isTokenValid) {
                    try {
                        await oauthService_1.oauthService.refreshToken(userId, connection.platform);
                        const refreshedConnection = await oauthService_1.oauthService.getConnection(userId, connection.platform);
                        if (!refreshedConnection) {
                            throw new Error("Failed to refresh token");
                        }
                        oauthConnection.accessToken = refreshedConnection.accessToken;
                    }
                    catch (refreshError) {
                        platformStatuses.push({
                            platform: connection.platform,
                            status: "token_expired",
                            error: "Token expired and refresh failed",
                        });
                        continue;
                    }
                }
                const service = socialMediaServiceFactory_1.socialMediaServiceFactory.getService(connection.platform);
                const result = await service.fetchUserPosts(oauthConnection.accessToken, {
                    limit,
                    pageToken,
                });
                for (const post of result.posts) {
                    const existingPost = await database_1.prisma.post.findUnique({
                        where: {
                            platform_platformPostId: {
                                platform: connection.platform,
                                platformPostId: post.id,
                            },
                        },
                    });
                    if (!existingPost) {
                        await database_1.prisma.post.create({
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
                        hasComments: true,
                    });
                }
                platformStatuses.push({
                    platform: connection.platform,
                    status: "connected",
                    postsCount: result.posts.length,
                    pagination: result.pagination,
                });
            }
            catch (platformError) {
                console.error(`Error fetching posts from ${connection.platform}:`, platformError);
                platformStatuses.push({
                    platform: connection.platform,
                    status: "error",
                    error: platformError.message,
                });
            }
        }
        allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        res.status(200).json({
            message: "Posts fetched successfully",
            data: {
                posts: allPosts.slice(0, limit),
                platforms: platformStatuses,
                totalPosts: allPosts.length,
            },
        });
    }
    catch (error) {
        console.error("Fetch posts error:", error);
        res.status(500).json({
            error: "Failed to fetch posts",
            message: "An error occurred while fetching posts from connected platforms",
        });
    }
});
router.post("/analysis/start", authMiddleware_1.authenticateToken, async (req, res) => {
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
        const validation = await services_1.analysisOrchestrationService.validateAnalysisPrerequisites(postId, userId);
        if (!validation.valid) {
            res.status(400).json({
                error: "Analysis prerequisites not met",
                message: "Cannot start analysis for this post",
                details: validation.errors,
            });
            return;
        }
        const existingJob = await database_1.prisma.analysisJob.findFirst({
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
        const post = await database_1.prisma.post.findFirst({
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
        if (post.comments.length === 0) {
            try {
                await fetchCommentsForPost(post, userId);
                const updatedPost = await database_1.prisma.post.findFirst({
                    where: { id: postId },
                    include: { comments: true },
                });
                if (updatedPost) {
                    post.comments = updatedPost.comments;
                }
            }
            catch (fetchError) {
                res.status(500).json({
                    error: "Failed to fetch comments",
                    message: "Could not fetch comments from the platform",
                    details: fetchError.message,
                });
                return;
            }
        }
        const job = await services_1.jobManager.createJob(postId, userId, post.comments.length);
        const commentIds = post.comments.map((c) => c.id);
        services_1.analysisOrchestrationService.processAnalysis(job.id, postId, userId, commentIds).catch((error) => {
            console.error(`Background analysis failed for job ${job.id}:`, error);
        });
        res.status(202).json({
            message: "Analysis started successfully",
            data: {
                jobId: job.id,
                status: job.status,
                progress: job.progress,
                estimatedTime: services_1.analysisOrchestrationService.estimateAnalysisTime(post.comments.length),
                totalComments: post.comments.length,
            },
        });
    }
    catch (error) {
        console.error("Start analysis error:", error);
        res.status(500).json({
            error: "Failed to start analysis",
            message: "An error occurred while starting the analysis",
        });
    }
});
router.get("/analysis/:id/status", authMiddleware_1.authenticateToken, async (req, res) => {
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
        const job = await database_1.prisma.analysisJob.findFirst({
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
    }
    catch (error) {
        console.error("Get job status error:", error);
        res.status(500).json({
            error: "Failed to get job status",
            message: "An error occurred while retrieving job status",
        });
    }
});
async function fetchCommentsForPost(post, userId) {
    const oauthConnection = await oauthService_1.oauthService.getConnection(userId, post.platform);
    if (!oauthConnection) {
        throw new Error("OAuth connection not found for platform");
    }
    const isTokenValid = await oauthService_1.oauthService.validateToken(userId, post.platform);
    if (!isTokenValid) {
        await oauthService_1.oauthService.refreshToken(userId, post.platform);
        const refreshedConnection = await oauthService_1.oauthService.getConnection(userId, post.platform);
        if (!refreshedConnection) {
            throw new Error("Failed to refresh token");
        }
        oauthConnection.accessToken = refreshedConnection.accessToken;
    }
    const service = socialMediaServiceFactory_1.socialMediaServiceFactory.getService(post.platform);
    const result = await service.fetchPostComments(oauthConnection.accessToken, post.platformPostId, {
        limit: 1000,
    });
    const commentsToCreate = result.comments.map((comment) => ({
        platformCommentId: comment.id,
        text: comment.text,
        authorName: comment.authorName,
        publishedAt: comment.publishedAt,
        likeCount: comment.likeCount,
        postId: post.id,
    }));
    if (commentsToCreate.length > 0) {
        await database_1.prisma.comment.createMany({
            data: commentsToCreate,
            skipDuplicates: true,
        });
    }
}
exports.default = router;
//# sourceMappingURL=platformRoutes.js.map