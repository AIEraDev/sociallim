import { EmailProvider, SendEmailOptions, EmailResult } from "../types";
export declare class NodemailerProvider implements EmailProvider {
    private transporter;
    constructor(config: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    });
    sendEmail(options: SendEmailOptions): Promise<EmailResult>;
}
//# sourceMappingURL=nodemailerProvider.d.ts.map