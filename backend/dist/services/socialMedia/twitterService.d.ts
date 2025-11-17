import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo } from "../../types/socialMedia";
interface TwitterTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    refresh_token?: string;
}
export declare class TwitterService implements ISocialMediaService {
    readonly platform: "TWITTER";
    private readonly apiClient;
    private readonly baseUrl;
    private readonly authUrl;
    private readonly tokenUrl;
    private readonly clientId;
    private readonly clientSecret;
    private readonly callbackUrl;
    private rateLimitInfo;
    constructor();
    generateAuthUrl(codeChallenge: string, state: string): string;
    exchangeCodeForToken(code: string, codeVerifier: string): Promise<TwitterTokenResponse>;
    fetchUserInfo(accessToken: string): Promise<any>;
    validateToken(accessToken: string): Promise<boolean>;
    refreshAccessToken(refreshToken: string): Promise<TwitterTokenResponse>;
    fetchUserPosts(accessToken: string, options?: FetchPostsOptions): Promise<{
        posts: SocialMediaPost[];
        pagination?: PaginationInfo;
    }>;
    fetchPostComments(accessToken: string, postId: string, options?: FetchCommentsOptions): Promise<{
        comments: SocialMediaComment[];
        pagination?: PaginationInfo;
    }>;
    getRateLimitInfo(accessToken: string): Promise<RateLimitInfo>;
    private handleApiError;
    private transformError;
}
export declare const twitterService: {
    readonly instance: TwitterService;
};
export {};
//# sourceMappingURL=twitterService.d.ts.map