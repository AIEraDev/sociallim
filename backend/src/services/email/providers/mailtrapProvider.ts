import { MailtrapClient } from "mailtrap";
import { EmailProvider, SendEmailOptions, EmailResult } from "../types";

export class MailtrapProvider implements EmailProvider {
  private client: MailtrapClient;
  private accountId: string;

  constructor(token: string, accountId: string) {
    this.client = new MailtrapClient({ token });
    this.accountId = accountId;
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send email via Mailtrap",
      };
    }
  }
}
