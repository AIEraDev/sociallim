"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const youtubeService_1 = require("../youtubeService");
jest.mock("../../../utils/logger", () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock("axios");
const mockedAxios = axios_1.default;
describe("YouTubeService", () => {
    let youtubeService;
    let mockAxiosInstance;
    beforeEach(() => {
        jest.clearAllMocks();
        mockAxiosInstance = {
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() },
            },
        };
        mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
        youtubeService = new youtubeService_1.YouTubeService();
    });
    describe("fetchUserPosts", () => {
        const mockAccessToken = "mock-access-token";
        it("should fetch user videos successfully", async () => {
            const mockChannelResponse = {
                status: 200,
                data: {
                    items: [
                        {
                            id: "UC123456789",
                            snippet: {
                                customUrl: "testchannel",
                            },
                        },
                    ],
                },
            };
            const mockPlaylistResponse = {
                status: 200,
                data: {
                    items: [
                        {
                            contentDetails: {
                                videoId: "video123",
                            },
                        },
                    ],
                    nextPageToken: "next-token",
                    pageInfo: {
                        totalResults: 100,
                        resultsPerPage: 50,
                    },
                },
            };
            const mockVideoDetailsResponse = {
                status: 200,
                data: {
                    items: [
                        {
                            id: "video123",
                            snippet: {
                                title: "Test Video",
                                description: "Test Description",
                                publishedAt: "2023-01-01T00:00:00Z",
                                thumbnails: {
                                    medium: {
                                        url: "https://example.com/thumb.jpg",
                                    },
                                },
                            },
                            statistics: {
                                viewCount: "1000",
                                likeCount: "50",
                            },
                        },
                    ],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockChannelResponse).mockResolvedValueOnce(mockPlaylistResponse).mockResolvedValueOnce(mockVideoDetailsResponse);
            const result = await youtubeService.fetchUserPosts(mockAccessToken);
            expect(result.posts).toHaveLength(1);
            expect(result.posts[0]).toEqual({
                id: "video123",
                title: "Test Video",
                url: "https://www.youtube.com/watch?v=video123",
                publishedAt: new Date("2023-01-01T00:00:00Z"),
                platform: client_1.Platform.YOUTUBE,
                thumbnailUrl: "https://example.com/thumb.jpg",
                description: "Test Description",
                viewCount: 1000,
                likeCount: 50,
            });
            expect(result.pagination).toEqual({
                nextPageToken: "next-token",
                totalResults: 100,
                resultsPerPage: 50,
            });
        });
        it("should handle no channel found error", async () => {
            const mockChannelResponse = {
                status: 200,
                data: {
                    items: [],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockChannelResponse);
            await expect(youtubeService.fetchUserPosts(mockAccessToken)).rejects.toMatchObject({
                code: "NO_CHANNEL",
                message: "No YouTube channel found for this user",
                status: 404,
                platform: client_1.Platform.YOUTUBE,
            });
        });
        it("should handle API errors", async () => {
            const mockError = {
                response: {
                    status: 403,
                    data: {
                        error: {
                            message: "Quota exceeded",
                            errors: [{ reason: "quotaExceeded" }],
                        },
                    },
                },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(mockError);
            await expect(youtubeService.fetchUserPosts(mockAccessToken)).rejects.toMatchObject({
                code: "quotaExceeded",
                message: "Quota exceeded",
                status: 403,
                platform: client_1.Platform.YOUTUBE,
            });
        });
    });
    describe("fetchPostComments", () => {
        const mockAccessToken = "mock-access-token";
        const mockVideoId = "video123";
        it("should fetch video comments successfully", async () => {
            const mockCommentsResponse = {
                status: 200,
                data: {
                    items: [
                        {
                            snippet: {
                                topLevelComment: {
                                    id: "comment123",
                                    snippet: {
                                        textDisplay: "Great video!",
                                        authorDisplayName: "John Doe",
                                        publishedAt: "2023-01-01T00:00:00Z",
                                        likeCount: 5,
                                    },
                                },
                            },
                            replies: {
                                comments: [
                                    {
                                        id: "reply123",
                                        snippet: {
                                            textDisplay: "Thanks!",
                                            authorDisplayName: "Video Author",
                                            publishedAt: "2023-01-01T01:00:00Z",
                                            likeCount: 2,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                    nextPageToken: "next-token",
                    pageInfo: {
                        totalResults: 50,
                        resultsPerPage: 20,
                    },
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockCommentsResponse);
            const result = await youtubeService.fetchPostComments(mockAccessToken, mockVideoId);
            expect(result.comments).toHaveLength(2);
            expect(result.comments[0]).toEqual({
                id: "comment123",
                text: "Great video!",
                authorName: "John Doe",
                publishedAt: new Date("2023-01-01T00:00:00Z"),
                likeCount: 5,
            });
            expect(result.comments[1]).toEqual({
                id: "reply123",
                text: "Thanks!",
                authorName: "Video Author",
                publishedAt: new Date("2023-01-01T01:00:00Z"),
                likeCount: 2,
                parentCommentId: "comment123",
            });
            expect(result.pagination).toEqual({
                nextPageToken: "next-token",
                totalResults: 50,
                resultsPerPage: 20,
            });
        });
        it("should handle empty comments", async () => {
            const mockCommentsResponse = {
                status: 200,
                data: {
                    items: [],
                    pageInfo: {
                        totalResults: 0,
                        resultsPerPage: 20,
                    },
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockCommentsResponse);
            const result = await youtubeService.fetchPostComments(mockAccessToken, mockVideoId);
            expect(result.comments).toHaveLength(0);
            expect(result.pagination?.totalResults).toBe(0);
        });
    });
    describe("validateToken", () => {
        const mockAccessToken = "mock-access-token";
        it("should return true for valid token", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    items: [{ id: "UC123456789" }],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await youtubeService.validateToken(mockAccessToken);
            expect(result).toBe(true);
        });
        it("should return false for invalid token", async () => {
            const mockError = {
                response: {
                    status: 401,
                    data: {
                        error: {
                            message: "Invalid credentials",
                        },
                    },
                },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(mockError);
            const result = await youtubeService.validateToken(mockAccessToken);
            expect(result).toBe(false);
        });
        it("should return false for empty response", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    items: [],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await youtubeService.validateToken(mockAccessToken);
            expect(result).toBe(false);
        });
    });
    describe("getRateLimitInfo", () => {
        it("should return rate limit information", async () => {
            const mockAccessToken = "mock-access-token";
            const result = await youtubeService.getRateLimitInfo(mockAccessToken);
            expect(result).toHaveProperty("remaining");
            expect(result).toHaveProperty("resetTime");
            expect(result).toHaveProperty("limit");
            expect(typeof result.remaining).toBe("number");
            expect(result.resetTime instanceof Date).toBe(true);
            expect(typeof result.limit).toBe("number");
        });
    });
});
//# sourceMappingURL=youtubeService.test.js.map