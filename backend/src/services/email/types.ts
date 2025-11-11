export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
}

export interface SendEmailOptions {
  to: string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
