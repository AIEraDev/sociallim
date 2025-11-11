import { Request, Response, NextFunction } from "express";
import { ResponseUtil } from "../utils/response";

/**
 * Bot Protection Middleware
 *
 * Implements multiple layers of bot detection and prevention
 */

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  reasons: string[];
}

export class BotProtection {
  private static suspiciousUserAgents = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /requests/i, /axios/i, /postman/i];

  private static suspiciousIPs = new Set<string>();
  private static registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();

  /**
   * Detect potential bot behavior
   */
  static detectBot(req: Request): BotDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check User-Agent
    const userAgent = req.headers["user-agent"] || "";
    if (!userAgent) {
      reasons.push("Missing User-Agent header");
      confidence += 0.3;
    } else if (this.suspiciousUserAgents.some((pattern) => pattern.test(userAgent))) {
      reasons.push("Suspicious User-Agent");
      confidence += 0.4;
    }

    // Check for common bot headers
    const botHeaders = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];
    const hasMultipleProxyHeaders = botHeaders.filter((header) => req.headers[header]).length > 1;
    if (hasMultipleProxyHeaders) {
      reasons.push("Multiple proxy headers detected");
      confidence += 0.2;
    }

    // Check request timing (too fast)
    const ip = this.getClientIP(req);
    const now = Date.now();
    const attempts = this.registrationAttempts.get(ip);

    if (attempts) {
      const timeDiff = now - attempts.lastAttempt;
      if (timeDiff < 5000) {
        // Less than 5 seconds between attempts
        reasons.push("Requests too frequent");
        confidence += 0.3;
      }

      if (attempts.count > 3) {
        reasons.push("Too many registration attempts");
        confidence += 0.4;
      }
    }

    // Update attempt tracking
    this.registrationAttempts.set(ip, {
      count: (attempts?.count || 0) + 1,
      lastAttempt: now,
    });

    // Clean old entries (older than 1 hour)
    for (const [key, value] of this.registrationAttempts.entries()) {
      if (now - value.lastAttempt > 3600000) {
        this.registrationAttempts.delete(key);
      }
    }

    return {
      isBot: confidence > 0.5,
      confidence,
      reasons,
    };
  }

  /**
   * Get client IP address
   */
  private static getClientIP(req: Request): string {
    return (req.headers["cf-connecting-ip"] as string) || (req.headers["x-forwarded-for"] as string) || (req.headers["x-real-ip"] as string) || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
  }

  /**
   * Middleware to block suspected bots
   */
  static blockBots(threshold: number = 0.7) {
    return (req: Request, res: Response, next: NextFunction) => {
      const detection = this.detectBot(req);

      if (detection.isBot && detection.confidence >= threshold) {
        console.warn("Bot detected:", {
          ip: this.getClientIP(req),
          userAgent: req.headers["user-agent"],
          confidence: detection.confidence,
          reasons: detection.reasons,
        });

        return ResponseUtil.forbidden(res, "Automated requests are not allowed. Please use a web browser to create an account.");
      }

      // Add detection info to request for logging
      (req as any).botDetection = detection;
      next();
    };
  }

  /**
   * Honeypot field validation
   */
  static validateHoneypot(req: Request): boolean {
    // Check for honeypot fields that should be empty
    const honeypotFields = ["website", "url", "homepage", "company"];

    for (const field of honeypotFields) {
      if (req.body[field] && req.body[field].trim() !== "") {
        return false; // Bot filled honeypot field
      }
    }

    return true;
  }

  /**
   * Check for disposable email domains
   */
  static async isDisposableEmail(email: string): Promise<boolean> {
    const domain = email.split("@")[1]?.toLowerCase();

    // Common disposable email domains
    const disposableDomains = ["10minutemail.com", "tempmail.org", "guerrillamail.com", "mailinator.com", "yopmail.com", "temp-mail.org", "throwaway.email", "getnada.com", "maildrop.cc", "sharklasers.com"];

    return disposableDomains.includes(domain);
  }

  /**
   * Comprehensive registration validation
   */
  static async validateRegistration(req: Request): Promise<{ valid: boolean; reason?: string }> {
    // Check honeypot
    if (!this.validateHoneypot(req)) {
      return { valid: false, reason: "Honeypot validation failed" };
    }

    // Check disposable email
    const { email } = req.body;
    if (email && (await this.isDisposableEmail(email))) {
      return { valid: false, reason: "Disposable email addresses are not allowed" };
    }

    // Check bot detection
    const detection = this.detectBot(req);
    if (detection.isBot && detection.confidence > 0.8) {
      return { valid: false, reason: "Automated registration detected" };
    }

    return { valid: true };
  }
}
