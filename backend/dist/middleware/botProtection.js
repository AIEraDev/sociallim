"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotProtection = void 0;
const response_1 = require("../utils/response");
class BotProtection {
    static detectBot(req) {
        const reasons = [];
        let confidence = 0;
        const userAgent = req.headers["user-agent"] || "";
        if (!userAgent) {
            reasons.push("Missing User-Agent header");
            confidence += 0.3;
        }
        else if (this.suspiciousUserAgents.some((pattern) => pattern.test(userAgent))) {
            reasons.push("Suspicious User-Agent");
            confidence += 0.4;
        }
        const botHeaders = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];
        const hasMultipleProxyHeaders = botHeaders.filter((header) => req.headers[header]).length > 1;
        if (hasMultipleProxyHeaders) {
            reasons.push("Multiple proxy headers detected");
            confidence += 0.2;
        }
        const ip = this.getClientIP(req);
        const now = Date.now();
        const attempts = this.registrationAttempts.get(ip);
        if (attempts) {
            const timeDiff = now - attempts.lastAttempt;
            if (timeDiff < 5000) {
                reasons.push("Requests too frequent");
                confidence += 0.3;
            }
            if (attempts.count > 3) {
                reasons.push("Too many registration attempts");
                confidence += 0.4;
            }
        }
        this.registrationAttempts.set(ip, {
            count: (attempts?.count || 0) + 1,
            lastAttempt: now,
        });
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
    static getClientIP(req) {
        return req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
    }
    static blockBots(threshold = 0.7) {
        return (req, res, next) => {
            const detection = this.detectBot(req);
            if (detection.isBot && detection.confidence >= threshold) {
                console.warn("Bot detected:", {
                    ip: this.getClientIP(req),
                    userAgent: req.headers["user-agent"],
                    confidence: detection.confidence,
                    reasons: detection.reasons,
                });
                return response_1.ResponseUtil.forbidden(res, "Automated requests are not allowed. Please use a web browser to create an account.");
            }
            req.botDetection = detection;
            next();
        };
    }
    static validateHoneypot(req) {
        const honeypotFields = ["website", "url", "homepage", "company"];
        for (const field of honeypotFields) {
            if (req.body[field] && req.body[field].trim() !== "") {
                return false;
            }
        }
        return true;
    }
    static async isDisposableEmail(email) {
        const domain = email.split("@")[1]?.toLowerCase();
        const disposableDomains = ["10minutemail.com", "tempmail.org", "guerrillamail.com", "mailinator.com", "yopmail.com", "temp-mail.org", "throwaway.email", "getnada.com", "maildrop.cc", "sharklasers.com"];
        return disposableDomains.includes(domain);
    }
    static async validateRegistration(req) {
        if (!this.validateHoneypot(req)) {
            return { valid: false, reason: "Honeypot validation failed" };
        }
        const { email } = req.body;
        if (email && (await this.isDisposableEmail(email))) {
            return { valid: false, reason: "Disposable email addresses are not allowed" };
        }
        const detection = this.detectBot(req);
        if (detection.isBot && detection.confidence > 0.8) {
            return { valid: false, reason: "Automated registration detected" };
        }
        return { valid: true };
    }
}
exports.BotProtection = BotProtection;
BotProtection.suspiciousUserAgents = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /requests/i, /axios/i, /postman/i];
BotProtection.suspiciousIPs = new Set();
BotProtection.registrationAttempts = new Map();
//# sourceMappingURL=botProtection.js.map