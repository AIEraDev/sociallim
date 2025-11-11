import { Platform } from "@prisma/client";
import { ISocialMediaService } from "../../types/socialMedia";
export declare class SocialMediaServiceFactory {
    static getService(platform: Platform): ISocialMediaService;
    static getAllServices(): ISocialMediaService[];
    static getSupportedPlatforms(): Platform[];
    static isPlatformSupported(platform: string): boolean;
}
export declare const socialMediaServiceFactory: typeof SocialMediaServiceFactory;
//# sourceMappingURL=socialMediaServiceFactory.d.ts.map