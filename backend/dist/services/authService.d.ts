import { User } from "@prisma/client";
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface EmailVerificationData {
    email: string;
    token: string;
}
export interface LoginData {
    email: string;
    password: string;
}
import { AuthenticatedUser } from "../middleware/authMiddleware";
export interface AuthResult {
    user: AuthenticatedUser;
    token: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export declare class AuthService {
    private static readonly SALT_ROUNDS;
    private static readonly TOKEN_EXPIRATION_SECONDS;
    static register(data: RegisterData): Promise<{
        user: AuthenticatedUser;
        verificationToken: string;
        limitedToken?: any;
    }>;
    static login(data: LoginData): Promise<AuthResult>;
    static verifyToken(token: string): Promise<User | null>;
    static logout(userId: string): Promise<void>;
    static getUserProfile(userId: string): Promise<AuthenticatedUser | null>;
    static updateProfile(userId: string, data: Partial<Pick<User, "firstName" | "lastName" | "email">>): Promise<AuthenticatedUser>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    private static generateToken;
    private static generateLimitedToken;
    private static generateVerificationToken;
    private static storeUserSession;
    private static storeLimitedUserSession;
    private static getSessionByToken;
    private static removeUserSession;
    static getUserSession(userId: string): Promise<any | null>;
    static cleanupExpiredSessions(): Promise<void>;
    static verifyEmail(token: string): Promise<AuthResult>;
    static resendEmailVerification(email: string): Promise<string>;
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=authService.d.ts.map