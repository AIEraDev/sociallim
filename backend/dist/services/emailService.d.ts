export declare class EmailService {
    private static provider;
    private static fromEmail;
    static sendVerificationEmail(email: string, verificationToken: string): Promise<void>;
    static sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
    static sendWelcomeEmail(email: string, firstName?: string): Promise<void>;
    private static renderPasswordResetEmailTemplate;
    private static renderWelcomeEmailTemplate;
    private static renderVerificationEmailTemplate;
}
//# sourceMappingURL=emailService.d.ts.map