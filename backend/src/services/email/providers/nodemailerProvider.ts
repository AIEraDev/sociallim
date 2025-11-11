import nodemailer from "nodemailer";
import { EmailProvider, SendEmailOptions, EmailResult } from "../types";

export class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send email via Nodemailer",
      };
    }
  }
}
