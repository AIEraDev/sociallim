import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo } from "../../types/socialMedia";
export declare class YouTubeService implements ISocialMediaService {
    readonly platform: "YOUTUBE";
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
export declare const youtubeService: {
    readonly instance: YouTubeService;
};
//# sourceMappingURL=youtubeService.d.ts.map