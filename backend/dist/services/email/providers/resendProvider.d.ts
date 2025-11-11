import { EmailProvider, SendEmailOptions, EmailResult } from "../types";
export declare class ResendProvider implements EmailProvider {
    private resend;
    constructor(apiKey: string);
    sendEmail(options: SendEmailOptions): Promise<EmailResult>;
}
//# sourceMappingURL=resendProvider.d.ts.map