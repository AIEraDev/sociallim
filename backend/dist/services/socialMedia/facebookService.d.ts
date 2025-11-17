import { ISocialMediaService, SocialMediaPost, SocialMediaComment, FetchPostsOptions, FetchCommentsOptions, PaginationInfo, RateLimitInfo } from "../../types/socialMedia";
interface FacebookUser {
    id: string;
    name: string;
    email?: string;
    picture?: {
        data: {
            url: string;
        };
    };
}
interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
    tasks?: string[];
    instagram_business_account?: {
        id: string;
    };
}
interface InstagramAccount {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    biography?: string;
    website?: string;
}
interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}
export declare class FacebookService implements ISocialMediaService {
    private appId;
    private appSecret;
    readonly platform: "FACEBOOK";
    private readonly apiClient;
    private readonly baseUrl;
    private readonly authUrl;
    private readonly tokenUrl;
    private readonly redirectUri;
    private rateLimitInfo;
    constructor(appId?: string, appSecret?: string);
    generateAuthUrl(state: string): string;
    exchangeCodeForToken(code: string): Promise<FacebookTokenResponse>;
    getLongLivedToken(shortLivedToken: string): Promise<FacebookTokenResponse>;
    fetchUserInfo(accessToken: string): Promise<FacebookUser>;
    getUserPages(accessToken: string): Promise<FacebookPage[]>;
    getInstagramAccount(instagramAccountId: string, pageAccessToken: string): Promise<InstagramAccount>;
    getAllInstagramAccounts(accessToken: string): Promise<Array<{
        page: FacebookPage;
        instagram: InstagramAccount;
    }>>;
    fetchUserPosts(accessToken: string, options?: FetchPostsOptions): Promise<{
        posts: SocialMediaPost[];
        pagination?: PaginationInfo;
    }>;
    fetchPostComments(accessToken: string, postId: string, options?: FetchCommentsOptions): Promise<{
        comments: SocialMediaComment[];
        pagination?: PaginationInfo;
    }>;
    validateToken(accessToken: string): Promise<boolean>;
    revokeToken(accessToken: string): Promise<void>;
    getRateLimitInfo(accessToken: string): Promise<RateLimitInfo>;
    private handleApiError;
    private transformError;
}
export declare const facebookService: {
    readonly instance: FacebookService;
};
export {};
//# sourceMappingURL=facebookService.d.ts.map