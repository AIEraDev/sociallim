"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerProvider = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class NodemailerProvider {
    constructor(config) {
        this.transporter = nodemailer_1.default.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass,
            },
        });
    }
    async sendEmail(options) {
        try {
            const info = await this.transporter.sendMail({
                from: options.from,
                to: options.to.join(", "),
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            return {
                success: true,
                messageId: info.messageId,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || "Failed to send email via Nodemailer",
            };
        }
    }
}
exports.NodemailerProvider = NodemailerProvider;
//# sourceMappingURL=nodemailerProvider.js.map