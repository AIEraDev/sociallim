import { config } from "../../config/environment";
import { EmailProvider } from "./types";
import { NodemailerProvider } from "./providers/nodemailerProvider";
import { ResendProvider } from "./providers/resendProvider";
import { MailtrapProvider } from "./providers/mailtrapProvider";
import { ConsoleProvider } from "./providers/consoleProvider";

export class EmailProviderFactory {
  static createProvider(): EmailProvider {
    const provider = config.email.provider;

    switch (provider) {
      case "nodemailer":
        if (!config.email.nodemailer.host || !config.email.nodemailer.auth.user || !config.email.nodemailer.auth.pass) {
          console.warn("Nodemailer SMTP credentials not configured, falling back to console provider");
          return new ConsoleProvider();
        }
        return new NodemailerProvider(config.email.nodemailer);

      case "resend":
        if (!config.email.resend.apiKey) {
          console.warn("Resend API key not configured, falling back to console provider");
          return new ConsoleProvider();
        }
        return new ResendProvider(config.email.resend.apiKey);

      case "mailtrap":
        if (!config.email.mailtrap.token || !config.email.mailtrap.accountId) {
          console.warn("Mailtrap credentials not configured, falling back to console provider");
          return new ConsoleProvider();
        }
        return new MailtrapProvider(config.email.mailtrap.token, config.email.mailtrap.accountId);

      case "console":
        return new ConsoleProvider();

      default:
        console.warn(`Unknown email provider: ${provider}, falling back to console provider`);
        return new ConsoleProvider();
    }
  }
}
