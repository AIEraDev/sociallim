"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendProvider = void 0;
const resend_1 = require("resend");
class ResendProvider {
    constructor(apiKey) {
        this.resend = new resend_1.Resend(apiKey);
    }
    async sendEmail(options) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: options.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            if (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }
            return {
                success: true,
                messageId: data?.id,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || "Failed to send email via Resend",
            };
        }
    }
}
exports.ResendProvider = ResendProvider;
//# sourceMappingURL=resendProvider.js.map