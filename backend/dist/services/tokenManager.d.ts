import { Platform } from "@prisma/client";
export declare class TokenManager {
    getValidToken(userId: string, platform: Platform): Promise<string | null>;
    validateAllTokens(userId: string): Promise<{
        platform: Platform;
        isValid: boolean;
        needsReconnection: boolean;
        error?: string;
    }[]>;
    refreshExpiringTokens(userId: string): Promise<{
        platform: Platform;
        refreshed: boolean;
        error?: string;
    }[]>;
    private markConnectionAsInvalid;
    batchValidateTokens(userIds: string[]): Promise<Map<string, {
        platform: Platform;
        isValid: boolean;
    }[]>>;
    cleanupExpiredTokens(): Promise<{
        deletedConnections: number;
        errors: string[];
    }>;
}
export declare const tokenManager: TokenManager;
//# sourceMappingURL=tokenManager.d.ts.map