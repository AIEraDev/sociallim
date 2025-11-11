export declare const CacheStrategies: {
    readonly USER_DATA: {
        readonly ttl: 600;
    };
    readonly AUTH_SESSION: {
        readonly ttl: 300;
    };
    readonly EMAIL_LOOKUP: {
        readonly ttl: 300;
    };
    readonly ANALYSIS_RESULTS: {
        readonly ttl: 3600;
    };
    readonly PLATFORM_CONNECTIONS: {
        readonly ttl: 900;
    };
    readonly CONTENT_DATA: {
        readonly ttl: 1800;
    };
    readonly SHORT_TERM: {
        readonly ttl: 60;
    };
    readonly LONG_TERM: {
        readonly ttl: 7200;
    };
};
export declare const CacheTags: {
    readonly USER: "user";
    readonly SESSION: "session";
    readonly ANALYSIS: "analysis";
    readonly PLATFORM: "platform";
    readonly CONTENT: "content";
};
export declare function createCacheStrategy(ttl: number, tags?: string[]): {
    tags?: string[] | undefined;
    ttl: number;
};
export declare const CommonCacheConfigs: {
    readonly userProfile: () => {
        tags?: string[] | undefined;
        ttl: number;
    };
    readonly authSession: () => {
        tags?: string[] | undefined;
        ttl: number;
    };
    readonly analysisResults: () => {
        tags?: string[] | undefined;
        ttl: number;
    };
    readonly platformConnections: () => {
        tags?: string[] | undefined;
        ttl: number;
    };
    readonly contentData: () => {
        tags?: string[] | undefined;
        ttl: number;
    };
};
export declare function getEnvironmentCacheTtl(baseTtl: number): number;
export declare function createEnvCacheStrategy(ttl: number, tags?: string[]): {
    tags?: string[] | undefined;
    ttl: number;
};
//# sourceMappingURL=prismaCache.d.ts.map