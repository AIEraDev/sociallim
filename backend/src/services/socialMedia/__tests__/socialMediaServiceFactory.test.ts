import { Platform } from "@prisma/client";
import { SocialMediaServiceFactory } from "../socialMediaServiceFactory";
import { YouTubeService } from "../youtubeService";
import { InstagramService } from "../instagramService";
import { TwitterService } from "../twitterService";
import { TikTokService } from "../tiktokService";

// Mock logger to avoid console output during tests
jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("SocialMediaServiceFactory", () => {
  describe("getService", () => {
    it("should return YouTube service for YOUTUBE platform", () => {
      const service = SocialMediaServiceFactory.getService(Platform.YOUTUBE);
      expect(service).toBeInstanceOf(YouTubeService);
      expect(service.platform).toBe(Platform.YOUTUBE);
    });

    it("should return Instagram service for INSTAGRAM platform", () => {
      const service = SocialMediaServiceFactory.getService(Platform.INSTAGRAM);
      expect(service).toBeInstanceOf(InstagramService);
      expect(service.platform).toBe(Platform.INSTAGRAM);
    });

    it("should return Twitter service for TWITTER platform", () => {
      const service = SocialMediaServiceFactory.getService(Platform.TWITTER);
      expect(service).toBeInstanceOf(TwitterService);
      expect(service.platform).toBe(Platform.TWITTER);
    });

    it("should return TikTok service for TIKTOK platform", () => {
      const service = SocialMediaServiceFactory.getService(Platform.TIKTOK);
      expect(service).toBeInstanceOf(TikTokService);
      expect(service.platform).toBe(Platform.TIKTOK);
    });

    it("should throw error for unsupported platform", () => {
      expect(() => {
        SocialMediaServiceFactory.getService("UNSUPPORTED" as Platform);
      }).toThrow("Unsupported platform: UNSUPPORTED");
    });
  });

  describe("getAllServices", () => {
    it("should return all social media services", () => {
      const services = SocialMediaServiceFactory.getAllServices();

      expect(services).toHaveLength(4);
      expect(services[0]).toBeInstanceOf(YouTubeService);
      expect(services[1]).toBeInstanceOf(InstagramService);
      expect(services[2]).toBeInstanceOf(TwitterService);
      expect(services[3]).toBeInstanceOf(TikTokService);
    });
  });

  describe("getSupportedPlatforms", () => {
    it("should return all supported platforms", () => {
      const platforms = SocialMediaServiceFactory.getSupportedPlatforms();

      expect(platforms).toHaveLength(4);
      expect(platforms).toContain(Platform.YOUTUBE);
      expect(platforms).toContain(Platform.INSTAGRAM);
      expect(platforms).toContain(Platform.TWITTER);
      expect(platforms).toContain(Platform.TIKTOK);
    });
  });

  describe("isPlatformSupported", () => {
    it("should return true for supported platforms", () => {
      expect(SocialMediaServiceFactory.isPlatformSupported("YOUTUBE")).toBe(true);
      expect(SocialMediaServiceFactory.isPlatformSupported("INSTAGRAM")).toBe(true);
      expect(SocialMediaServiceFactory.isPlatformSupported("TWITTER")).toBe(true);
      expect(SocialMediaServiceFactory.isPlatformSupported("TIKTOK")).toBe(true);
    });

    it("should return false for unsupported platforms", () => {
      expect(SocialMediaServiceFactory.isPlatformSupported("FACEBOOK")).toBe(false);
      expect(SocialMediaServiceFactory.isPlatformSupported("LINKEDIN")).toBe(false);
      expect(SocialMediaServiceFactory.isPlatformSupported("SNAPCHAT")).toBe(false);
      expect(SocialMediaServiceFactory.isPlatformSupported("")).toBe(false);
    });
  });
});
