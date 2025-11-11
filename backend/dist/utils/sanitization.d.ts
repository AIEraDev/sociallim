export interface SanitizationOptions {
    allowHtml?: boolean;
    maxLength?: number;
    trimWhitespace?: boolean;
    normalizeWhitespace?: boolean;
    removeControlChars?: boolean;
}
export declare function sanitizeText(input: string, options?: SanitizationOptions): string;
export declare function sanitizeEmail(email: string): string;
export declare function sanitizeUrl(url: string, allowedProtocols?: string[]): string;
export declare function sanitizeFilename(filename: string): string;
export declare function sanitizeJson(input: any): any;
export declare function sanitizeSqlInput(input: string): string;
export declare function sanitizeSearchQuery(query: string): string;
export declare function sanitizeUserContent(content: string): string;
export declare const sanitizeRequestBody: (options?: SanitizationOptions) => (req: any, res: any, next: any) => void;
export declare const sanitizers: {
    text: (input: string, maxLength?: number) => string;
    html: (input: string, maxLength?: number) => string;
    email: typeof sanitizeEmail;
    url: (input: string) => string;
    filename: typeof sanitizeFilename;
    search: typeof sanitizeSearchQuery;
    userContent: typeof sanitizeUserContent;
    json: typeof sanitizeJson;
    sql: typeof sanitizeSqlInput;
};
//# sourceMappingURL=sanitization.d.ts.map