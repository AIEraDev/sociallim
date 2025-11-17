import { Platform } from "@prisma/client";
export declare class SocialMediaServiceFactory {
    static getService(platform: Platform): import("./youtubeService").YouTubeService | import("./instagramService").InstagramService | import("./twitterService").TwitterService | import("./tiktokService").TikTokService | import("./facebookService").FacebookService;
    static getAllServices(): (import("./youtubeService").YouTubeService | import("./instagramService").InstagramService | import("./twitterService").TwitterService | import("./tiktokService").TikTokService | import("./facebookService").FacebookService)[];
    static getSupportedPlatforms(): Platform[];
    static isPlatformSupported(platform: string): boolean;
}
export declare const socialMediaServiceFactory: typeof SocialMediaServiceFactory;
//# sourceMappingURL=socialMediaServiceFactory.d.ts.map