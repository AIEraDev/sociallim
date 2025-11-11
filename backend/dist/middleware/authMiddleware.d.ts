import { Request, Response, NextFunction } from "express";
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
declare global {
    namespace Express {
        interface User extends AuthenticatedUser {
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnership: (req: Request, res: Response, next: NextFunction) => void;
export declare const authRateLimit: (maxAttempts?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map