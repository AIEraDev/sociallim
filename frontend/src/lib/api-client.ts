/**
 * API Client for Comment Sentiment Analyzer
 * Provides type-safe HTTP client with error handling, retry mechanisms, and authentication
 */

import { User, CookieAuthResponse, LoginRequest, RegisterRequest, Post, AnalysisResult, AnalysisJob, ConnectedPlatform, Platform, ApiResponse, ExportRequest, ComparisonRequest, ComparisonResult } from "@/types";
import { env } from "@/lib/env";
import { PostsInterface } from "@/hooks/use-platforms";

// Enhanced error types for better error handling
export interface ApiError {
  message: string;
  code: string;
  status?: number;
  details?: Record<string, unknown>;
  correlationId?: string;
  userMessage?: string;
}

export interface TwitterAuthResponse {
  success: boolean;
  authUrl: string;
  state: string;
}

export interface TwitterCallbackResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
    followersCount?: number;
    followingCount?: number;
  };
}

export interface FacebookAuthResponse {
  success: boolean;
  authUrl: string;
  state: string;
}

export interface FacebookCallbackResponse {
  success: boolean;
  message: string;
  data: {
    facebook: {
      id: string;
      name: string;
      email?: string;
      picture?: string;
      pages: Array<{
        id: string;
        name: string;
        category: string;
      }>;
    };
    instagram: Array<{
      id: string;
      username: string;
      name?: string;
      profilePictureUrl?: string;
      followersCount?: number;
      followingCount?: number;
      mediaCount?: number;
      connectedPageName: string;
    }>;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestQueue: Map<string, Promise<unknown>> = new Map();

  constructor(baseURL: string = env.API_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generate a unique request key for deduplication
   */
  private getRequestKey(endpoint: string, options: RequestInit): string {
    const method = options.method || "GET";
    const body = options.body || "";
    return `${method}:${endpoint}:${typeof body === "string" ? body : JSON.stringify(body)}`;
  }

  /**
   * Get user-friendly error message based on error code
   */
  private getUserFriendlyMessage(error: ApiError): string {
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection and try again.",
      AUTHENTICATION_ERROR: "Please log in to continue.",
      AUTHORIZATION_ERROR: "You don't have permission to perform this action.",
      VALIDATION_ERROR: "Please check your input and try again.",
      NOT_FOUND_ERROR: "The requested resource was not found.",
      CONFLICT_ERROR: "This resource already exists or conflicts with existing data.",
      RATE_LIMITED: "Too many requests. Please wait a moment before trying again.",
      SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again later.",
      EXTERNAL_SERVICE_ERROR: "External service is temporarily unavailable. Please try again later.",
      TOKEN_EXPIRED: "Your session has expired. Please log in again.",
      INVALID_TOKEN: "Invalid authentication. Please log in again.",
      DATABASE_ERROR: "Database error occurred. Please try again.",
      FILE_UPLOAD_ERROR: "File upload failed. Please check the file and try again.",
    };

    return error.userMessage || errorMessages[error.code] || error.message || "An unexpected error occurred. Please try again.";
  }

  /**
   * Make HTTP request with comprehensive error handling and deduplication
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const requestKey = this.getRequestKey(endpoint, options);

    // Deduplicate identical requests (for GET requests only)
    if ((!options.method || options.method === "GET") && this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const requestPromise = (async () => {
      const url = `${this.baseURL}${endpoint}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      // For cookie-based auth, no need to add Authorization header
      // Cookies are automatically sent by the browser with credentials: 'include'

      // Add correlation ID for request tracking
      headers["X-Correlation-ID"] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
          credentials: "include", // Include cookies in requests
        });

        clearTimeout(timeoutId);

        let data;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          const apiError: ApiError = {
            message: data?.error?.message || data?.message || `HTTP ${response.status}`,
            code: data?.error?.code || data?.code || `HTTP_${response.status}`,
            status: response.status,
            details: data?.error?.details || data?.details,
            correlationId: data?.error?.correlationId,
            userMessage: data?.error?.message,
          };

          // Handle authentication errors
          if (response.status === 401) {
            this.handleAuthError();
          }

          throw apiError;
        }

        return {
          success: true,
          data: data?.data || data,
          message: data?.message,
        } as ApiResponse<T>;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw {
            message: "Request timed out",
            code: "REQUEST_TIMEOUT",
            status: 408,
            userMessage: "Request timed out. Please try again.",
          } as ApiError;
        }

        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw {
            message: "Network error",
            code: "NETWORK_ERROR",
            userMessage: "Unable to connect to the server. Please check your internet connection.",
          } as ApiError;
        }

        throw error;
      }
    })();

    // Cache GET requests
    if (!options.method || options.method === "GET") {
      this.requestQueue.set(requestKey, requestPromise);

      // Clean up cache after request completes
      requestPromise.finally(() => {
        this.requestQueue.delete(requestKey);
      });
    }

    try {
      return await requestPromise;
    } catch (error) {
      const apiError = error as ApiError;

      return {
        success: false,
        error: apiError,
      };
    }
  }

  /**
   * Handle authentication errors by triggering logout
   */
  private handleAuthError(): void {
    // For cookie-based auth, we need to call the logout endpoint to clear cookies
    this.logout().catch(console.error);

    // Emit custom event for auth error handling
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth:error", {
          detail: { message: "Authentication required" },
        })
      );
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<CookieAuthResponse>> {
    console.log("LOGIN DATA:", credentials);
    const response = await this.request<CookieAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    // With cookie-based auth, the server automatically sets secure cookies
    // No need to handle tokens client-side

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; verificationToken?: string; limitedToken: string }>> {
    const response = await this.request<{ user: User; verificationToken?: string; limitedToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // With cookie-based auth, the server automatically sets secure cookies
    // No need to handle tokens client-side

    return response;
  }

  async logout(): Promise<void> {
    // Call logout endpoint to clear server-side session and cookies
    await this.request<void>("/auth/logout", { method: "POST", credentials: "include" });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>("/auth/profile");
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse<CookieAuthResponse>> {
    const response = await this.request<CookieAuthResponse>(`/auth/verify-email/${token}`);

    // With cookie-based auth, the server automatically sets secure cookies
    // No need to handle tokens client-side

    return response;
  }

  // Platform connection endpoints
  async getConnectedPlatforms(): Promise<ApiResponse<ConnectedPlatform[]>> {
    return this.request<ConnectedPlatform[]>("/platforms");
  }

  async disconnectPlatform(platform: Platform): Promise<ApiResponse<void>> {
    return this.request<void>(`/platforms/disconnect/${platform.toLowerCase()}`, { method: "DELETE" });
  }

  // Get Twitter authorization URL
  async getTwitterAuthUrl(): Promise<TwitterAuthResponse> {
    const response = this.request<TwitterAuthResponse>("/oauth/twitter/authorize");
    return (await response).data!;
  }

  // Complete Twitter OAuth callback
  async completeTwitterAuth(code: string, state: string): Promise<ApiResponse<TwitterCallbackResponse>> {
    return this.request<TwitterCallbackResponse>("/oauth/twitter/callback", {
      method: "POST",
      body: JSON.stringify({ code, state }),
      credentials: "include",
    });
  }

  /**
   *
   *
   *
   *
   *
   *
   *
   */
  async getFacebookAuthUrl(): Promise<FacebookAuthResponse> {
    const response = this.request<FacebookAuthResponse>("/oauth/meta/authorize");
    return (await response).data!;
  }

  async completeFacebookAuth(code: string, state: string): Promise<ApiResponse<FacebookCallbackResponse>> {
    return this.request<FacebookCallbackResponse>("/oauth/meta/callback", {
      method: "POST",
      body: JSON.stringify({ code, state }),
      credentials: "include",
    });
  }

  /**
   *
   *
   *
   *
   *
   *
   *
   */

  // Posts endpoints
  async getUserPlatformPosts(platform?: Platform, source: string = "live", limit: number = 5): Promise<PostsInterface> {
    const query: string = `?source=${source}&limit=${limit}`;
    const response = await fetch(`${this.baseURL}/platforms/${platform}/posts${query}`, { credentials: "include" });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data);
    }

    return data.data;
  }

  async getPost(postId: string): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/${postId}`);
  }

  // Analysis endpoints
  async startAnalysis(postId: string): Promise<ApiResponse<AnalysisJob>> {
    return this.request<AnalysisJob>("/analysis/start", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
  }

  async getAnalysisStatus(jobId: string): Promise<ApiResponse<AnalysisJob>> {
    return this.request<AnalysisJob>(`/analysis/${jobId}/status`);
  }

  async getAnalysisResult(analysisId: string): Promise<ApiResponse<AnalysisResult>> {
    return this.request<AnalysisResult>(`/analysis/${analysisId}/results`);
  }

  async getAnalysisHistory(): Promise<ApiResponse<AnalysisResult[]>> {
    return this.request<AnalysisResult[]>("/analysis/history");
  }

  // Export endpoints
  async exportAnalysis(request: ExportRequest): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.request<{ downloadUrl: string }>(`/analysis/${request.analysisId}/export`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Comparison endpoints
  async compareAnalyses(request: ComparisonRequest): Promise<ApiResponse<ComparisonResult>> {
    return this.request<ComparisonResult>("/analysis/compare", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/health");
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for dependency injection in tests
export { ApiClient };
