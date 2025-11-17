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
    source: joi_1.default.string().valid("db", "live").default("db").messages({
        "any.only": "Source must be 'db' (database) or 'live' (fetch fresh from social platform).",
    }),
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
router.get("/", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const userId = req.user.id;
        const userConnections = await oauthService_1.oauthService.getUserConnections(userId);
        res.status(200).json({
            message: "Connected platforms fetched successfully",
            data: userConnections,
        });
    }
    catch (error) {
        console.error("Error fetching connected platforms:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "An error occurred while fetching connected platforms",
        });
    }
});
router.get("/:platform/posts", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error: platformError } = platformParamSchema.validate(req.params);
        if (platformError) {
            res.status(400).json({
                error: "Invalid platform",
                message: platformError.details[0].message,
            });
            return;
        }
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
        const platform = req.params.platform.toUpperCase();
        if (source === "db") {
            const posts = await database_1.prisma.post.findMany({
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
        const oauthConnection = await oauthService_1.oauthService.getConnection(userId, platform);
        if (!oauthConnection) {
            res.status(400).json({
                error: "Platform not connected",
                message: `Please connect your ${platform} account first`,
            });
            return;
        }
        const isTokenValid = await oauthService_1.oauthService.validateToken(userId, platform);
        if (!isTokenValid) {
            try {
                await oauthService_1.oauthService.refreshToken(userId, platform);
                const refreshedConnection = await oauthService_1.oauthService.getConnection(userId, platform);
                if (!refreshedConnection) {
                    throw new Error("Failed to refresh token");
                }
                oauthConnection.accessToken = refreshedConnection.accessToken;
            }
            catch (refreshError) {
                res.status(401).json({
                    error: "Token expired",
                    message: "OAuth token expired and refresh failed. Please reconnect your account.",
                });
                return;
            }
        }
        const service = socialMediaServiceFactory_1.socialMediaServiceFactory.getService(platform);
        const result = await service.fetchUserPosts(oauthConnection.accessToken, {
            limit,
            pageToken,
        });
        const storedPosts = [];
        for (const post of result.posts) {
            try {
                const existingPost = await database_1.prisma.post.findUnique({
                    where: {
                        platform_platformPostId: {
                            platform,
                            platformPostId: post.id,
                        },
                    },
                });
                if (!existingPost) {
                    let postUrl = post.url;
                    if (!postUrl) {
                        try {
                            const userInfo = await socialMediaServiceFactory_1.socialMediaServiceFactory.getService(platform).fetchUserInfo(oauthConnection.accessToken);
                            const username = userInfo.username || userInfo.display_name || userInfo.open_id || "user";
                            postUrl = `https://www.tiktok.com/@${username}/video/${post.id}`;
                            console.log("Generated URL with username:", postUrl);
                        }
                        catch (userInfoError) {
                            console.warn("Failed to fetch user info for URL generation:", userInfoError);
                            postUrl = `https://www.tiktok.com/@user/video/${post.id}`;
                        }
                    }
                    await database_1.prisma.post.create({
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
                    hasComments: true,
                });
            }
            catch (dbError) {
                console.warn(`Failed to store post ${post.id} in database:`, dbError);
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
    }
    catch (error) {
        console.error(`Error fetching posts from ${req.params.platform}:`, error);
        res.status(500).json({
            error: "Failed to fetch posts",
            message: `An error occurred while fetching posts from ${req.params.platform}`,
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
router.get("/:platform/user", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
            return;
        }
        const { error: platformError } = platformParamSchema.validate(req.params);
        if (platformError) {
            res.status(400).json({
                error: "Invalid platform",
                message: platformError.details[0].message,
            });
            return;
        }
        const userId = req.user.id;
        const platform = req.params.platform.toUpperCase();
        const oauthConnection = await oauthService_1.oauthService.getConnection(userId, platform);
        if (!oauthConnection) {
            res.status(400).json({
                error: "Platform not connected",
                message: `Please connect your ${platform} account first`,
            });
            return;
        }
        const isTokenValid = await oauthService_1.oauthService.validateToken(userId, platform);
        if (!isTokenValid) {
            try {
                await oauthService_1.oauthService.refreshToken(userId, platform);
                const refreshedConnection = await oauthService_1.oauthService.getConnection(userId, platform);
                if (!refreshedConnection) {
                    throw new Error("Failed to refresh token");
                }
                oauthConnection.accessToken = refreshedConnection.accessToken;
            }
            catch (refreshError) {
                res.status(401).json({
                    error: "Token expired",
                    message: "OAuth token expired and refresh failed. Please reconnect your account.",
                });
                return;
            }
        }
        const service = socialMediaServiceFactory_1.socialMediaServiceFactory.getService(platform);
        const userInfo = await service.fetchUserInfo(oauthConnection.accessToken);
        res.status(200).json({
            message: "User info fetched successfully",
            data: {
                userInfo,
                platform,
            },
        });
    }
    catch (error) {
        console.error(`Error fetching user info from ${req.params.platform}:`, error);
        res.status(500).json({
            error: "Failed to fetch user info",
            message: `An error occurred while fetching user info from ${req.params.platform}`,
        });
    }
});
exports.default = router;
//# sourceMappingURL=platformRoutes.js.map