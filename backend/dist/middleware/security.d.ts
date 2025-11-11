import { Request, Response, NextFunction } from "express";
import cors from "cors";
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
};
export declare const helmetOptions: {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: string[];
            styleSrc: string[];
            fontSrc: string[];
            imgSrc: string[];
            scriptSrc: string[];
            connectSrc: any[];
            frameSrc: string[];
            objectSrc: string[];
            upgradeInsecureRequests: never[] | null;
        };
    };
    crossOriginEmbedderPolicy: boolean;
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    noSniff: boolean;
    frameguard: {
        action: "deny";
    };
    xssFilter: boolean;
};
export declare const requestSizeLimit: (maxSize?: string) => ((req: Request, res: Response, next: NextFunction) => void);
export declare const ipFilter: (options: {
    whitelist?: string[];
    blacklist?: string[];
    trustProxy?: boolean;
}) => ((req: Request, res: Response, next: NextFunction) => void);
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContentType: (allowedTypes: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const setupSecurity: () => (((req: Request, res: Response, next: NextFunction) => void) | ((req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void))[];
//# sourceMappingURL=security.d.ts.map