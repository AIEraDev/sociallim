import { EmailProvider, SendEmailOptions, EmailResult } from "../types";

export class ConsoleProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
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
