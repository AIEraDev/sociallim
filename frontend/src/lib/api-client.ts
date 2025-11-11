/**
 * API Client for Comment Sentiment Analyzer
 * Provides type-safe HTTP client with error handling, retry mechanisms, and authentication
 */

import { User, CookieAuthResponse, LoginRequest, RegisterRequest, Post, AnalysisResult, AnalysisJob, ConnectedPlatform, Platform, ApiResponse, ExportRequest, ComparisonRequest, ComparisonResult } from "@/types";
import { env } from "@/lib/env";

// Enhanced error types for better error handling
export interface ApiError {
  message: string;
  code: string;
  status?: number;
  details?: Record<string, unknown>;
  retryable?: boolean;
  correlationId?: string;
  userMessage?: string;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: ApiError) => boolean;
}

// Circuit breaker for external service calls
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private failureThreshold: number = 3,
    private recoveryTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Service temporarily unavailable. Please try again later.");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: Map<string, Promise<unknown>> = new Map();

  constructor(baseURL: string = env.API_URL) {
    this.baseURL = baseURL;
    this.circuitBreaker = new CircuitBreaker();
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
   * Retry mechanism with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2, retryCondition = (error) => error.retryable || error.code === "NETWORK_ERROR" || (error.status && error.status >= 500) } = options;

    let lastError: ApiError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as ApiError;

        // Don't retry if this is the last attempt or if retry condition is not met
        if (attempt === maxAttempts || !retryCondition(lastError)) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const jitter = Math.random() * 0.1 * baseDelay;
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1) + jitter, maxDelay);

        console.warn(`Request failed (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms:`, {
          error: lastError.message,
          code: lastError.code,
          attempt,
          maxAttempts,
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
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
   * Make HTTP request with comprehensive error handling, retry logic, and deduplication
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, retryOptions?: RetryOptions): Promise<ApiResponse<T>> {
    const requestKey = this.getRequestKey(endpoint, options);

    // Deduplicate identical requests (for GET requests only)
    if ((!options.method || options.method === "GET") && this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const requestPromise = this.circuitBreaker.execute(async () => {
      return this.withRetry(async () => {
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
              retryable: data?.error?.retryable || response.status >= 500,
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
              retryable: true,
              userMessage: "Request timed out. Please try again.",
            } as ApiError;
          }

          if (error instanceof TypeError && error.message.includes("fetch")) {
            throw {
              message: "Network error",
              code: "NETWORK_ERROR",
              retryable: true,
              userMessage: "Unable to connect to the server. Please check your internet connection.",
            } as ApiError;
          }

          throw error;
        }
      }, retryOptions);
    });

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
    const response = await this.request<CookieAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
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
    await this.request<void>("/auth/logout", {
      method: "POST",
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/profile");
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

  async resendEmailVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Platform connection endpoints
  async getConnectedPlatforms(): Promise<ApiResponse<ConnectedPlatform[]>> {
    return this.request<ConnectedPlatform[]>("/platforms");
  }

  async connectPlatform(platform: Platform): Promise<ApiResponse<{ authUrl: string }>> {
    return this.request<{ authUrl: string }>(`/platforms/connect/${platform.toLowerCase()}`);
  }

  async disconnectPlatform(platform: Platform): Promise<ApiResponse<void>> {
    return this.request<void>(`/platforms/disconnect/${platform.toLowerCase()}`, {
      method: "DELETE",
    });
  }

  // Posts endpoints
  async getUserPosts(platform?: Platform): Promise<ApiResponse<Post[]>> {
    const query = platform ? `?platform=${platform}` : "";
    return this.request<Post[]>(`/platforms/posts${query}`);
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
