import { Request, Response, NextFunction } from "express";
export interface LimitedAuthenticatedUser {
    id: string;
    email: string;
    emailVerified: boolean;
    tokenType: "limited";
    scope: string[];
}
declare global {
    namespace Express {
        interface Request {
            limitedUser?: LimitedAuthenticatedUser;
        }
    }
}
export declare const authenticateLimitedToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticateAnyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=limitedAuthMiddleware.d.ts.map