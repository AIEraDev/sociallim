"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleProvider = void 0;
class ConsoleProvider {
    async sendEmail(options) {
        console.log(`
    📧 EMAIL (CONSOLE PROVIDER)
    ===========================
    From: ${options.from}
    To: ${options.to.join(", ")}
    Subject: ${options.subject}
    ===========================
    ${options.html}
    ===========================
    `);
        return {
            success: true,
            messageId: `console-${Date.now()}`,
        };
    }
}
exports.ConsoleProvider = ConsoleProvider;
//# sourceMappingURL=consoleProvider.js.map