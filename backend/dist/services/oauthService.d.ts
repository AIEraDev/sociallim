import { Platform } from "@prisma/client";
export interface OAuthTokenData {
    platform: Platform;
    platformUserId: string;
    accessToken: string;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
    profile?: any;
}
export interface TokenRefreshResult {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export declare class OAuthService {
    storeConnection(userId: string, tokenData: OAuthTokenData): Promise<void>;
    getConnection(userId: string, platform: Platform): Promise<{
        accessToken: string;
        refreshToken: string | null;
        platform: import(".prisma/client").$Enums.Platform;
        id: string;
        userId: string;
        platformUserId: string;
        tokenExpiresAt: Date | null;
        connectedAt: Date;
    } | null>;
    getUserConnections(userId: string): Promise<{
        platform: import(".prisma/client").$Enums.Platform;
        platformUserId: string;
        tokenExpiresAt: Date | null;
        connectedAt: Date;
    }[]>;
    isTokenExpired(tokenExpiresAt: Date | null, bufferMinutes?: number): boolean;
    refreshToken(userId: string, platform: Platform): Promise<TokenRefreshResult | null>;
    private refreshGoogleToken;
    private refreshInstagramToken;
    private refreshTwitterToken;
    private refreshTikTokToken;
    validateToken(userId: string, platform: Platform): Promise<boolean>;
    private validateYouTubeToken;
    private validateInstagramToken;
    private validateTwitterToken;
    private validateTikTokToken;
    private validateFacebookToken;
    disconnectPlatform(userId: string, platform: Platform): Promise<void>;
}
export declare const oauthService: OAuthService;
//# sourceMappingURL=oauthService.d.ts.map