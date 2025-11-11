import { Request, Response, NextFunction } from "express";
interface BotDetectionResult {
    isBot: boolean;
    confidence: number;
    reasons: string[];
}
export declare class BotProtection {
    private static suspiciousUserAgents;
    private static suspiciousIPs;
    private static registrationAttempts;
    static detectBot(req: Request): BotDetectionResult;
    private static getClientIP;
    static blockBots(threshold?: number): (req: Request, res: Response, next: NextFunction) => void;
    static validateHoneypot(req: Request): boolean;
    static isDisposableEmail(email: string): Promise<boolean>;
    static validateRegistration(req: Request): Promise<{
        valid: boolean;
        reason?: string;
    }>;
}
export {};
//# sourceMappingURL=botProtection.d.ts.map