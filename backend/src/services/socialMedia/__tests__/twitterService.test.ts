import axios from "axios";
import { Platform } from "@prisma/client";
import { TwitterService } from "../twitterService";
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

describe("TwitterService", () => {
  let twitterService: TwitterService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    twitterService = new TwitterService();
  });

  describe("fetchUserPosts", () => {
    const mockAccessToken = "mock-access-token";

    it("should fetch user tweets successfully", async () => {
      // Mock user response
      const mockUserResponse = {
        status: 200,
        data: {
          data: {
            id: "123456789",
            username: "testuser",
          },
        },
      };

      // Mock tweets response
      const mockTweetsResponse = {
        status: 200,
        data: {
          data: [
            {
              id: "tweet123",
              text: "This is a test tweet with some content",
              created_at: "2023-01-01T00:00:00.000Z",
              author_id: "123456789",
              public_metrics: {
                like_count: 10,
                retweet_count: 5,
                reply_count: 2,
                quote_count: 1,
              },
            },
          ],
          meta: {
            result_count: 1,
            next_token: "next-token-123",
          },
        },
        headers: {
          "x-rate-limit-remaining": "299",
          "x-rate-limit-reset": "1672531200",
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse).mockResolvedValueOnce(mockTweetsResponse);

      const result = await twitterService.fetchUserPosts(mockAccessToken);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]).toEqual({
        id: "tweet123",
        title: "This is a test tweet with some content",
        url: "https://twitter.com/user/status/tweet123",
        publishedAt: new Date("2023-01-01T00:00:00.000Z"),
        platform: Platform.TWITTER,
        description: "This is a test tweet with some content",
        viewCount: 1,
        likeCount: 10,
      });

      expect(result.pagination).toEqual({
        nextPageToken: "next-token-123",
        totalResults: 1,
        resultsPerPage: 1,
      });
    });

    it("should handle long tweet titles", async () => {
      const mockUserResponse = {
        status: 200,
        data: {
          data: {
            id: "123456789",
            username: "testuser",
          },
        },
      };

      const mockTweetsResponse = {
        status: 200,
        data: {
          data: [
            {
              id: "tweet123",
              text: "This is a very long tweet that exceeds fifty characters and should be truncated in the title",
              created_at: "2023-01-01T00:00:00.000Z",
              author_id: "123456789",
              public_metrics: {
                like_count: 0,
              },
            },
          ],
          meta: {
            result_count: 1,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse).mockResolvedValueOnce(mockTweetsResponse);

      const result = await twitterService.fetchUserPosts(mockAccessToken);

      expect(result.posts[0].title).toBe("This is a very long tweet that exceeds fifty ch...");
      expect(result.posts[0].description).toBe("This is a very long tweet that exceeds fifty characters and should be truncated in the title");
    });

    it("should handle empty tweets response", async () => {
      const mockUserResponse = {
        status: 200,
        data: {
          data: {
            id: "123456789",
            username: "testuser",
          },
        },
      };

      const mockTweetsResponse = {
        status: 200,
        data: {
          data: [],
          meta: {
            result_count: 0,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse).mockResolvedValueOnce(mockTweetsResponse);

      const result = await twitterService.fetchUserPosts(mockAccessToken);

      expect(result.posts).toHaveLength(0);
      expect(result.pagination?.totalResults).toBe(0);
    });

    it("should handle API errors", async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            errors: [
              {
                code: "UNAUTHORIZED",
                message: "Invalid or expired token",
              },
            ],
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(mockError);

      await expect(twitterService.fetchUserPosts(mockAccessToken)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
        status: 401,
        platform: Platform.TWITTER,
      });
    });
  });

  describe("fetchPostComments", () => {
    const mockAccessToken = "mock-access-token";
    const mockPostId = "tweet123";

    it("should fetch tweet replies successfully", async () => {
      const mockRepliesResponse = {
        status: 200,
        data: {
          data: [
            {
              id: "tweet123", // Original tweet
              text: "Original tweet content",
              created_at: "2023-01-01T00:00:00.000Z",
              author_id: "123456789",
              public_metrics: {
                like_count: 10,
                reply_count: 2,
              },
            },
            {
              id: "reply123",
              text: "This is a reply to the tweet",
              created_at: "2023-01-01T01:00:00.000Z",
              author_id: "987654321",
              in_reply_to_user_id: "123456789",
              public_metrics: {
                like_count: 5,
                reply_count: 0,
              },
            },
          ],
          includes: {
            users: [
              {
                id: "123456789",
                username: "originaluser",
              },
              {
                id: "987654321",
                username: "replyuser",
              },
            ],
          },
          meta: {
            result_count: 2,
            next_token: "next-token-456",
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockRepliesResponse);

      const result = await twitterService.fetchPostComments(mockAccessToken, mockPostId);

      expect(result.comments).toHaveLength(1); // Should exclude the original tweet
      expect(result.comments[0]).toEqual({
        id: "reply123",
        text: "This is a reply to the tweet",
        authorName: "replyuser",
        publishedAt: new Date("2023-01-01T01:00:00.000Z"),
        likeCount: 5,
        replyCount: 0,
      });

      expect(result.pagination?.nextPageToken).toBe("next-token-456");
    });

    it("should handle replies without user data", async () => {
      const mockRepliesResponse = {
        status: 200,
        data: {
          data: [
            {
              id: "reply123",
              text: "This is a reply to the tweet",
              created_at: "2023-01-01T01:00:00.000Z",
              author_id: "987654321",
              public_metrics: {
                like_count: 5,
              },
            },
          ],
          includes: {
            users: [], // No user data
          },
          meta: {
            result_count: 1,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockRepliesResponse);

      const result = await twitterService.fetchPostComments(mockAccessToken, mockPostId);

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].authorName).toBe("User 987654321");
    });

    it("should handle empty replies", async () => {
      const mockRepliesResponse = {
        status: 200,
        data: {
          data: [],
          meta: {
            result_count: 0,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockRepliesResponse);

      const result = await twitterService.fetchPostComments(mockAccessToken, mockPostId);

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
          data: {
            id: "123456789",
            username: "testuser",
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await twitterService.validateToken(mockAccessToken);

      expect(result).toBe(true);
    });

    it("should return false for invalid token", async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            errors: [
              {
                code: "UNAUTHORIZED",
                message: "Invalid or expired token",
              },
            ],
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(mockError);

      const result = await twitterService.validateToken(mockAccessToken);

      expect(result).toBe(false);
    });

    it("should return false for response without user id", async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            username: "testuser",
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await twitterService.validateToken(mockAccessToken);

      expect(result).toBe(false);
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return rate limit information from API response", async () => {
      const mockAccessToken = "mock-access-token";
      const mockResponse = {
        status: 200,
        data: {
          data: {
            id: "123456789",
          },
        },
        headers: {
          "x-rate-limit-remaining": "250",
          "x-rate-limit-reset": "1672531200",
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await twitterService.getRateLimitInfo(mockAccessToken);

      expect(result.remaining).toBe(250);
      expect(result.resetTime).toEqual(new Date(1672531200 * 1000));
    });

    it("should return cached info if API call fails", async () => {
      const mockAccessToken = "mock-access-token";
      const mockError = {
        response: {
          status: 401,
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(mockError);

      const result = await twitterService.getRateLimitInfo(mockAccessToken);

      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("resetTime");
      expect(result).toHaveProperty("limit");
    });
  });
});
