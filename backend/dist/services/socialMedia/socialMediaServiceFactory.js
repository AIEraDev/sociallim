"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialMediaServiceFactory = exports.SocialMediaServiceFactory = void 0;
const client_1 = require("@prisma/client");
const youtubeService_1 = require("./youtubeService");
const instagramService_1 = require("./instagramService");
const twitterService_1 = require("./twitterService");
const tiktokService_1 = require("./tiktokService");
class SocialMediaServiceFactory {
    static getService(platform) {
        switch (platform) {
            case client_1.Platform.YOUTUBE:
                return youtubeService_1.youtubeService.instance;
            case client_1.Platform.INSTAGRAM:
                return instagramService_1.instagramService.instance;
            case client_1.Platform.TWITTER:
                return twitterService_1.twitterService.instance;
            case client_1.Platform.TIKTOK:
                return tiktokService_1.tiktokService.instance;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
    static getAllServices() {
        return [youtubeService_1.youtubeService.instance, instagramService_1.instagramService.instance, twitterService_1.twitterService.instance, tiktokService_1.tiktokService.instance];
    }
    static getSupportedPlatforms() {
        return [client_1.Platform.YOUTUBE, client_1.Platform.INSTAGRAM, client_1.Platform.TWITTER, client_1.Platform.TIKTOK];
    }
    static isPlatformSupported(platform) {
        return Object.values(client_1.Platform).includes(platform);
    }
}
exports.SocialMediaServiceFactory = SocialMediaServiceFactory;
exports.socialMediaServiceFactory = SocialMediaServiceFactory;
//# sourceMappingURL=socialMediaServiceFactory.js.map