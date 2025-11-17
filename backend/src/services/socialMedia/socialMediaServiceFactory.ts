import { Platform } from "@prisma/client";
import { twitterService } from "./twitterService";
import { tiktokService } from "./tiktokService";
import { metaService } from "./metaService";

/**
 * Factory class to get the appropriate social media service based on platform
 */
export class SocialMediaServiceFactory {
  /**
   * Get the social media service for a specific platform
   */
  static getService(platform: Platform) {
    switch (platform) {
      case Platform.INSTAGRAM:
      case Platform.FACEBOOK:
        // Both Instagram and Facebook use the Meta service
        return metaService.instance;
      case Platform.TWITTER:
        return twitterService.instance;
      case Platform.TIKTOK:
        return tiktokService.instance;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get all available social media services
   */
  static getAllServices() {
    return [metaService.instance, twitterService.instance, tiktokService.instance];
  }

  /**
   * Get all supported platforms
   */
  static getSupportedPlatforms(): Platform[] {
    return [Platform.FACEBOOK, Platform.INSTAGRAM, Platform.TWITTER, Platform.TIKTOK];
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
