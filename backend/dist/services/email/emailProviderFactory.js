"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProviderFactory = void 0;
const environment_1 = require("../../config/environment");
const resendProvider_1 = require("./providers/resendProvider");
const mailtrapProvider_1 = require("./providers/mailtrapProvider");
const consoleProvider_1 = require("./providers/consoleProvider");
class EmailProviderFactory {
    static createProvider() {
        const provider = environment_1.config.email.provider;
        switch (provider) {
            case "resend":
                if (!environment_1.config.email.resend.apiKey) {
                    console.warn("Resend API key not configured, falling back to console provider");
                    return new consoleProvider_1.ConsoleProvider();
                }
                return new resendProvider_1.ResendProvider(environment_1.config.email.resend.apiKey);
            case "mailtrap":
                if (!environment_1.config.email.mailtrap.token || !environment_1.config.email.mailtrap.accountId) {
                    console.warn("Mailtrap credentials not configured, falling back to console provider");
                    return new consoleProvider_1.ConsoleProvider();
                }
                return new mailtrapProvider_1.MailtrapProvider(environment_1.config.email.mailtrap.token, environment_1.config.email.mailtrap.accountId);
            case "console":
                return new consoleProvider_1.ConsoleProvider();
            default:
                console.warn(`Unknown email provider: ${provider}, falling back to console provider`);
                return new consoleProvider_1.ConsoleProvider();
        }
    }
}
exports.EmailProviderFactory = EmailProviderFactory;
//# sourceMappingURL=emailProviderFactory.js.map