import axios from "axios";
import { Platform } from "@prisma/client";
import { TikTokService } from "../tiktokService";
import { ApiError } from "../../../types/socialMedia";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger to avoid console output during tests
jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("TikTokService", () => {
  let tiktokService: TikTokService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    tiktokService = new TikTokService();
  });

  describe("fetchUserPosts", () => {
    const mockAccessToken = "mock-access-token";

    it("should fetch user videos successfully", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            videos: [
              {
                id: "video123",
                title: "Test TikTok Video",
                video_description: "This is a test video description",
                create_time: 1672531200, // Unix timestamp
                cover_image_url: "https://example.com/cover.jpg",
                share_url: "https://tiktok.com/@user/video/video123",
                view_count: 1000,
                like_count: 50,
                comment_count: 10,
              },
            ],
            cursor: "next-cursor-123",
          },
        },
        headers: {
          "x-tt-logid": "request-id-123",
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchUserPosts(mockAccessToken);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]).toEqual({
        id: "video123",
        title: "Test TikTok Video",
        url: "https://tiktok.com/@user/video/video123",
        publishedAt: new Date(1672531200 * 1000),
        platform: Platform.TIKTOK,
        thumbnailUrl: "https://example.com/cover.jpg",
        description: "This is a test video description",
        viewCount: 1000,
        likeCount: 50,
      });

      expect(result.pagination).toEqual({
        nextPageToken: "next-cursor-123",
        totalResults: undefined,
        resultsPerPage: 1,
      });
    });

    it("should handle videos without titles", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            videos: [
              {
                id: "video123",
                video_description: "Video description only",
                create_time: 1672531200,
                share_url: "https://tiktok.com/@user/video/video123",
                view_count: 100,
                like_count: 5,
              },
            ],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchUserPosts(mockAccessToken);

      expect(result.posts[0].title).toBe("Video description only");
    });

    it("should handle videos with no title or description", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            videos: [
              {
                id: "video123",
                create_time: 1672531200,
                share_url: "https://tiktok.com/@user/video/video123",
                view_count: 100,
              },
            ],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchUserPosts(mockAccessToken);

      expect(result.posts[0].title).toBe("TikTok Video");
    });

    it("should handle empty videos response", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            videos: [],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchUserPosts(mockAccessToken);

      expect(result.posts).toHaveLength(0);
      expect(result.pagination?.resultsPerPage).toBe(0);
    });

    it("should handle API errors", async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid access token",
            },
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      await expect(tiktokService.fetchUserPosts(mockAccessToken)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Invalid access token",
        status: 401,
        platform: Platform.TIKTOK,
      });
    });
  });

  describe("fetchPostComments", () => {
    const mockAccessToken = "mock-access-token";
    const mockVideoId = "video123";

    it("should fetch video comments successfully", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            comments: [
              {
                id: "comment123",
                text: "Great video!",
                create_time: 1672531200,
                like_count: 5,
                user: {
                  display_name: "Test User",
                  username: "testuser",
                },
              },
            ],
            cursor: "next-cursor-456",
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchPostComments(mockAccessToken, mockVideoId);

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toEqual({
        id: "comment123",
        text: "Great video!",
        authorName: "Test User",
        publishedAt: new Date(1672531200 * 1000),
        likeCount: 5,
      });

      expect(result.pagination?.nextPageToken).toBe("next-cursor-456");
    });

    it("should handle comments without user display name", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            comments: [
              {
                id: "comment123",
                text: "Great video!",
                create_time: 1672531200,
                like_count: 5,
                user: {
                  username: "testuser",
                },
              },
            ],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchPostComments(mockAccessToken, mockVideoId);

      expect(result.comments[0].authorName).toBe("testuser");
    });

    it("should handle comments without user data", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            comments: [
              {
                id: "comment123",
                text: "Great video!",
                create_time: 1672531200,
                like_count: 5,
              },
            ],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchPostComments(mockAccessToken, mockVideoId);

      expect(result.comments[0].authorName).toBe("TikTok User");
    });

    it("should handle empty comments", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            comments: [],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.fetchPostComments(mockAccessToken, mockVideoId);

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
          data: {
            user: {
              open_id: "user123",
              display_name: "Test User",
            },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.validateToken(mockAccessToken);

      expect(result).toBe(true);
    });

    it("should return false for invalid token", async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid access token",
            },
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      const result = await tiktokService.validateToken(mockAccessToken);

      expect(result).toBe(false);
    });

    it("should return false for response without user data", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {},
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await tiktokService.validateToken(mockAccessToken);

      expect(result).toBe(false);
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return rate limit information", async () => {
      const mockAccessToken = "mock-access-token";

      const result = await tiktokService.getRateLimitInfo(mockAccessToken);

      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("resetTime");
      expect(result).toHaveProperty("limit");
      expect(typeof result.remaining).toBe("number");
      expect(result.resetTime instanceof Date).toBe(true);
      expect(typeof result.limit).toBe("number");
    });
  });
});
