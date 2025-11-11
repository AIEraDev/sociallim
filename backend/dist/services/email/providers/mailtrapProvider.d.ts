import { EmailProvider, SendEmailOptions, EmailResult } from "../types";
export declare class MailtrapProvider implements EmailProvider {
    private client;
    private accountId;
    constructor(token: string, accountId: string);
    sendEmail(options: SendEmailOptions): Promise<EmailResult>;
}
//# sourceMappingURL=mailtrapProvider.d.ts.map