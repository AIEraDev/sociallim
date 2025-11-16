import { Platform } from "@prisma/client";
// import { ISocialMediaService } from "../../types/socialMedia";
import { youtubeService } from "./youtubeService";
import { instagramService } from "./instagramService";
import { twitterService } from "./twitterService";
import { tiktokService } from "./tiktokService";
import { facebookService } from "./facebookService";

/**
 * Factory class to get the appropriate social media service based on platform
 */
export class SocialMediaServiceFactory {
  /**
   * Get the social media service for a specific platform
   */
  static getService(platform: Platform) {
    switch (platform) {
      case Platform.YOUTUBE:
        return youtubeService.instance;
      case Platform.INSTAGRAM:
        return instagramService.instance;
      case Platform.TWITTER:
        return twitterService.instance;
      case Platform.TIKTOK:
        return tiktokService.instance;
      case Platform.FACEBOOK:
        return facebookService.instance;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get all available social media services
   */
  static getAllServices() {
    return [youtubeService.instance, instagramService.instance, twitterService.instance, tiktokService.instance, facebookService.instance];
  }

  /**
   * Get all supported platforms
   */
  static getSupportedPlatforms(): Platform[] {
    return [Platform.YOUTUBE, Platform.INSTAGRAM, Platform.TWITTER, Platform.TIKTOK, Platform.FACEBOOK];
  }

  /**
   * Check if a platform is supported
   */
  static isPlatformSupported(platform: string): boolean {
    return Object.values(Platform).includes(platform as Platform);
  }
}

// Export singleton instance
export const socialMediaServiceFactory = SocialMediaServiceFactory;
