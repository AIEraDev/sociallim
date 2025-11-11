import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo } from "../../types/socialMedia";
export declare class TikTokService implements ISocialMediaService {
    readonly platform: "TIKTOK";
    private readonly apiClient;
    private readonly baseUrl;
    private rateLimitInfo;
    constructor();
    fetchUserPosts(accessToken: string, options?: FetchPostsOptions): Promise<{
        posts: SocialMediaPost[];
        pagination?: PaginationInfo;
    }>;
    fetchPostComments(accessToken: string, postId: string, options?: FetchCommentsOptions): Promise<{
        comments: SocialMediaComment[];
        pagination?: PaginationInfo;
    }>;
    validateToken(accessToken: string): Promise<boolean>;
    getRateLimitInfo(accessToken: string): Promise<RateLimitInfo>;
    private handleApiError;
    private transformError;
}
export declare const tiktokService: {
    readonly instance: TikTokService;
};
//# sourceMappingURL=tiktokService.d.ts.map