"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailtrapProvider = void 0;
const mailtrap_1 = require("mailtrap");
class MailtrapProvider {
    constructor(token, accountId) {
        this.client = new mailtrap_1.MailtrapClient({ token });
        this.accountId = accountId;
    }
    async sendEmail(options) {
        try {
            const response = await this.client.send({
                from: {
                    email: options.from,
                    name: "EchoMind",
                },
                to: options.to.map((email) => ({ email })),
                subject: options.subject,
                html: options.html,
                text: options.text,
                category: "Authentication",
            });
            return {
                success: true,
                messageId: response.message_ids?.[0],
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || "Failed to send email via Mailtrap",
            };
        }
    }
}
exports.MailtrapProvider = MailtrapProvider;
//# sourceMappingURL=mailtrapProvider.js.map