"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const socialMediaServiceFactory_1 = require("../socialMediaServiceFactory");
const youtubeService_1 = require("../youtubeService");
const instagramService_1 = require("../instagramService");
const twitterService_1 = require("../twitterService");
const tiktokService_1 = require("../tiktokService");
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
            const service = socialMediaServiceFactory_1.SocialMediaServiceFactory.getService(client_1.Platform.YOUTUBE);
            expect(service).toBeInstanceOf(youtubeService_1.YouTubeService);
            expect(service.platform).toBe(client_1.Platform.YOUTUBE);
        });
        it("should return Instagram service for INSTAGRAM platform", () => {
            const service = socialMediaServiceFactory_1.SocialMediaServiceFactory.getService(client_1.Platform.INSTAGRAM);
            expect(service).toBeInstanceOf(instagramService_1.InstagramService);
            expect(service.platform).toBe(client_1.Platform.INSTAGRAM);
        });
        it("should return Twitter service for TWITTER platform", () => {
            const service = socialMediaServiceFactory_1.SocialMediaServiceFactory.getService(client_1.Platform.TWITTER);
            expect(service).toBeInstanceOf(twitterService_1.TwitterService);
            expect(service.platform).toBe(client_1.Platform.TWITTER);
        });
        it("should return TikTok service for TIKTOK platform", () => {
            const service = socialMediaServiceFactory_1.SocialMediaServiceFactory.getService(client_1.Platform.TIKTOK);
            expect(service).toBeInstanceOf(tiktokService_1.TikTokService);
            expect(service.platform).toBe(client_1.Platform.TIKTOK);
        });
        it("should throw error for unsupported platform", () => {
            expect(() => {
                socialMediaServiceFactory_1.SocialMediaServiceFactory.getService("UNSUPPORTED");
            }).toThrow("Unsupported platform: UNSUPPORTED");
        });
    });
    describe("getAllServices", () => {
        it("should return all social media services", () => {
            const services = socialMediaServiceFactory_1.SocialMediaServiceFactory.getAllServices();
            expect(services).toHaveLength(4);
            expect(services[0]).toBeInstanceOf(youtubeService_1.YouTubeService);
            expect(services[1]).toBeInstanceOf(instagramService_1.InstagramService);
            expect(services[2]).toBeInstanceOf(twitterService_1.TwitterService);
            expect(services[3]).toBeInstanceOf(tiktokService_1.TikTokService);
        });
    });
    describe("getSupportedPlatforms", () => {
        it("should return all supported platforms", () => {
            const platforms = socialMediaServiceFactory_1.SocialMediaServiceFactory.getSupportedPlatforms();
            expect(platforms).toHaveLength(4);
            expect(platforms).toContain(client_1.Platform.YOUTUBE);
            expect(platforms).toContain(client_1.Platform.INSTAGRAM);
            expect(platforms).toContain(client_1.Platform.TWITTER);
            expect(platforms).toContain(client_1.Platform.TIKTOK);
        });
    });
    describe("isPlatformSupported", () => {
        it("should return true for supported platforms", () => {
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("YOUTUBE")).toBe(true);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("INSTAGRAM")).toBe(true);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("TWITTER")).toBe(true);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("TIKTOK")).toBe(true);
        });
        it("should return false for unsupported platforms", () => {
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("FACEBOOK")).toBe(false);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("LINKEDIN")).toBe(false);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("SNAPCHAT")).toBe(false);
            expect(socialMediaServiceFactory_1.SocialMediaServiceFactory.isPlatformSupported("")).toBe(false);
        });
    });
});
//# sourceMappingURL=socialMediaServiceFactory.test.js.map