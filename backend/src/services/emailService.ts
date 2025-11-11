import { config } from "../config/environment";
import { EmailProviderFactory } from "./email/emailProviderFactory";
import { EmailProvider } from "./email/types";

/**
 * Email Service
 *
 * Handles sending emails for authentication and notifications.
 * Supports multiple providers: Mailtrap (dev), Resend (prod), Console (fallback)
 */
export class EmailService {
  private static provider: EmailProvider = EmailProviderFactory.createProvider();
  private static fromEmail = config.email.fromEmail;
  /**
   * Send email verification email
   *
   * @param email - User's email address
   * @param verificationToken - Email verification token
   */
  static async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${verificationToken}`;

    try {
      const result = await this.provider.sendEmail({
        from: this.fromEmail,
        to: [email],
        subject: "Verify your EchoMind account",
        html: await this.renderVerificationEmailTemplate(email, verificationUrl),
      });

      if (!result.success) {
        console.error("Failed to send verification email:", result.error);

        // Fallback to console logging
        if (config.env === "development") {
          console.log(`
          📧 EMAIL VERIFICATION (FALLBACK)
          ================================
          To: ${email}
          Subject: Verify your EchoMind account
          URL: ${verificationUrl}
          ================================
          `);
          return; // Don't throw error in development
        }

        throw new Error(`Failed to send verification email: ${result.error}`);
      }

      console.log("Verification email sent successfully:", {
        provider: config.email.provider,
        messageId: result.messageId,
        to: email,
      });
    } catch (error) {
      console.error("Email service error:", error);

      // Fallback to console logging in development
      if (config.env === "development") {
        console.log(`
        📧 EMAIL VERIFICATION (FALLBACK)
        ================================
        To: ${email}
        Subject: Verify your EchoMind account
        URL: ${verificationUrl}
        ================================
        `);
      } else {
        throw error;
      }
    }
  }

  /**
   * Send password reset email
   *
   * @param email - User's email address
   * @param resetToken - Password reset token
   */
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

    try {
      const result = await this.provider.sendEmail({
        from: this.fromEmail,
        to: [email],
        subject: "Reset your EchoMind password",
        html: await this.renderPasswordResetEmailTemplate(email, resetUrl),
      });

      if (!result.success) {
        console.error("Failed to send password reset email:", result.error);

        if (config.env === "development") {
          console.log(`
          📧 PASSWORD RESET (FALLBACK)
          ============================
          To: ${email}
          Subject: Reset your EchoMind password
          URL: ${resetUrl}
          ============================
          `);
          return;
        }

        throw new Error(`Failed to send password reset email: ${result.error}`);
      }

      console.log("Password reset email sent successfully:", {
        provider: config.email.provider,
        messageId: result.messageId,
        to: email,
      });
    } catch (error) {
      console.error("Email service error:", error);

      if (config.env === "development") {
        console.log(`
        📧 PASSWORD RESET (FALLBACK)
        ============================
        To: ${email}
        Subject: Reset your EchoMind password
        URL: ${resetUrl}
        ============================
        `);
      } else {
        throw error;
      }
    }
  }

  /**
   * Send welcome email after successful verification
   *
   * @param email - User's email address
   * @param firstName - User's first name
   */
  static async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName || "there";

    try {
      const result = await this.provider.sendEmail({
        from: this.fromEmail,
        to: [email],
        subject: "Welcome to EchoMind!",
        html: await this.renderWelcomeEmailTemplate(email, name),
      });

      if (!result.success) {
        console.error("Failed to send welcome email:", result.error);

        if (config.env === "development") {
          console.log(`
          📧 WELCOME EMAIL (FALLBACK)
          ===========================
          To: ${email}
          Subject: Welcome to EchoMind!
          Name: ${name}
          ===========================
          `);
          return;
        }

        throw new Error(`Failed to send welcome email: ${result.error}`);
      }

      console.log("Welcome email sent successfully:", {
        provider: config.email.provider,
        messageId: result.messageId,
        to: email,
      });
    } catch (error) {
      console.error("Email service error:", error);

      if (config.env === "development") {
        console.log(`
        📧 WELCOME EMAIL (FALLBACK)
        ===========================
        To: ${email}
        Subject: Welcome to EchoMind!
        Name: ${name}
        ===========================
        `);
      } else {
        throw error;
      }
    }
  }

  /**
   * Render password reset email template
   */
  private static async renderPasswordResetEmailTemplate(email: string, resetUrl: string): Promise<string> {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your EchoMind password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 EchoMind</h1>
          <h2>Password Reset</h2>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>You requested to reset your password for your EchoMind account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The EchoMind Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Render welcome email template
   */
  private static async renderWelcomeEmailTemplate(email: string, name: string): Promise<string> {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to EchoMind!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { margin: 10px 0; padding-left: 25px; position: relative; }
        .feature:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 EchoMind</h1>
          <h2>Welcome ${name}!</h2>
        </div>
        <div class="content">
          <p>Hi ${name}!</p>
          <p>Welcome to EchoMind! Your email has been verified and your account is now active.</p>
          
          <div class="features">
            <h3>You can now:</h3>
            <div class="feature">Connect your social media accounts</div>
            <div class="feature">Analyze audience sentiment</div>
            <div class="feature">Get AI-powered insights</div>
            <div class="feature">Track engagement trends</div>
            <div class="feature">Export detailed reports</div>
          </div>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/dashboard" class="button">Get Started</a>
          </p>
          
          <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The EchoMind Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Render email verification template
   *
   * @param email - User's email
   * @param verificationUrl - Verification URL
   * @returns HTML email template
   */
  private static async renderVerificationEmailTemplate(email: string, verificationUrl: string): Promise<string> {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your EchoMind account</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 EchoMind</h1>
          <h2>Verify Your Account</h2>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Welcome to EchoMind! Please verify your email address to complete your account setup.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with EchoMind, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The EchoMind Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}
