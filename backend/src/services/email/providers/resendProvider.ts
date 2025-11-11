import { Resend } from "resend";
import { EmailProvider, SendEmailOptions, EmailResult } from "../types";

export class ResendProvider implements EmailProvider {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send email via Resend",
      };
    }
  }
}
