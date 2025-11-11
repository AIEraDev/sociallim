"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const instagramService_1 = require("../instagramService");
jest.mock("axios");
const mockedAxios = axios_1.default;
jest.mock("../../../utils/logger", () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
describe("InstagramService", () => {
    let instagramService;
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
        instagramService = new instagramService_1.InstagramService();
    });
    describe("fetchUserPosts", () => {
        const mockAccessToken = "mock-access-token";
        it("should fetch user posts successfully", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    data: [
                        {
                            id: "post123",
                            caption: "Test post caption",
                            media_type: "IMAGE",
                            media_url: "https://example.com/image.jpg",
                            permalink: "https://instagram.com/p/post123",
                            timestamp: "2023-01-01T00:00:00+0000",
                        },
                    ],
                    paging: {
                        cursors: {
                            after: "next-cursor",
                        },
                        next: "https://graph.instagram.com/me/media?after=next-cursor",
                    },
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await instagramService.fetchUserPosts(mockAccessToken);
            expect(result.posts).toHaveLength(1);
            expect(result.posts[0]).toEqual({
                id: "post123",
                title: "Test post caption",
                url: "https://instagram.com/p/post123",
                publishedAt: new Date("2023-01-01T00:00:00+0000"),
                platform: client_1.Platform.INSTAGRAM,
                thumbnailUrl: "https://example.com/image.jpg",
                description: "Test post caption",
            });
            expect(result.pagination).toEqual({
                nextPageToken: "next-cursor",
                totalResults: undefined,
                resultsPerPage: 1,
            });
        });
        it("should handle posts without captions", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    data: [
                        {
                            id: "post123",
                            media_type: "IMAGE",
                            media_url: "https://example.com/image.jpg",
                            permalink: "https://instagram.com/p/post123",
                            timestamp: "2023-01-01T00:00:00+0000",
                        },
                    ],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await instagramService.fetchUserPosts(mockAccessToken);
            expect(result.posts[0].title).toBe("Instagram Post");
            expect(result.posts[0].description).toBeUndefined();
        });
        it("should handle empty response", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    data: [],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await instagramService.fetchUserPosts(mockAccessToken);
            expect(result.posts).toHaveLength(0);
            expect(result.pagination?.resultsPerPage).toBe(0);
        });
        it("should handle API errors", async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 190,
                            message: "Invalid OAuth access token",
                        },
                    },
                },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(mockError);
            await expect(instagramService.fetchUserPosts(mockAccessToken)).rejects.toMatchObject({
                code: "190",
                message: "Invalid OAuth access token",
                status: 400,
                platform: client_1.Platform.INSTAGRAM,
            });
        });
    });
    describe("fetchPostComments", () => {
        const mockAccessToken = "mock-access-token";
        const mockPostId = "post123";
        it("should return empty comments for personal accounts", async () => {
            const mockUserResponse = {
                status: 200,
                data: {
                    account_type: "PERSONAL",
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse);
            const result = await instagramService.fetchPostComments(mockAccessToken, mockPostId);
            expect(result.comments).toHaveLength(0);
            expect(result.pagination?.totalResults).toBe(0);
        });
        it("should fetch comments for business accounts", async () => {
            const mockUserResponse = {
                status: 200,
                data: {
                    account_type: "BUSINESS",
                },
            };
            const mockCommentsResponse = {
                status: 200,
                data: {
                    data: [
                        {
                            id: "comment123",
                            text: "Great post!",
                            username: "testuser",
                            timestamp: "2023-01-01T00:00:00+0000",
                        },
                    ],
                    paging: {
                        cursors: {
                            after: "next-cursor",
                        },
                    },
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse).mockResolvedValueOnce(mockCommentsResponse);
            const result = await instagramService.fetchPostComments(mockAccessToken, mockPostId);
            expect(result.comments).toHaveLength(1);
            expect(result.comments[0]).toEqual({
                id: "comment123",
                text: "Great post!",
                authorName: "testuser",
                publishedAt: new Date("2023-01-01T00:00:00+0000"),
                likeCount: 0,
            });
            expect(result.pagination?.nextPageToken).toBe("next-cursor");
        });
        it("should handle empty comments for business accounts", async () => {
            const mockUserResponse = {
                status: 200,
                data: {
                    account_type: "BUSINESS",
                },
            };
            const mockCommentsResponse = {
                status: 200,
                data: {
                    data: [],
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse).mockResolvedValueOnce(mockCommentsResponse);
            const result = await instagramService.fetchPostComments(mockAccessToken, mockPostId);
            expect(result.comments).toHaveLength(0);
            expect(result.pagination?.resultsPerPage).toBe(0);
        });
    });
    describe("validateToken", () => {
        const mockAccessToken = "mock-access-token";
        it("should return true for valid token", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    id: "123456789",
                    username: "testuser",
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await instagramService.validateToken(mockAccessToken);
            expect(result).toBe(true);
        });
        it("should return false for invalid token", async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 190,
                            message: "Invalid OAuth access token",
                        },
                    },
                },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(mockError);
            const result = await instagramService.validateToken(mockAccessToken);
            expect(result).toBe(false);
        });
        it("should return false for response without id", async () => {
            const mockResponse = {
                status: 200,
                data: {
                    username: "testuser",
                },
            };
            mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
            const result = await instagramService.validateToken(mockAccessToken);
            expect(result).toBe(false);
        });
    });
    describe("getRateLimitInfo", () => {
        it("should return rate limit information", async () => {
            const mockAccessToken = "mock-access-token";
            const result = await instagramService.getRateLimitInfo(mockAccessToken);
            expect(result).toHaveProperty("remaining");
            expect(result).toHaveProperty("resetTime");
            expect(result).toHaveProperty("limit");
            expect(typeof result.remaining).toBe("number");
            expect(result.resetTime instanceof Date).toBe(true);
            expect(typeof result.limit).toBe("number");
        });
    });
});
//# sourceMappingURL=instagramService.test.js.map