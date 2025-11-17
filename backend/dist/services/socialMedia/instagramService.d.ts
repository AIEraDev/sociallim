import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo } from "../../types/socialMedia";
export declare class InstagramService implements ISocialMediaService {
    readonly platform: "INSTAGRAM";
    private readonly apiClient;
    private readonly baseUrl;
    private rateLimitInfo;
    constructor();
    fetchUserInfo(accessToken: string): Promise<any>;
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
export declare const instagramService: {
    readonly instance: InstagramService;
};
//# sourceMappingURL=instagramService.d.ts.map