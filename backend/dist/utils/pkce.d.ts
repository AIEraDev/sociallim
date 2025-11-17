export interface PKCEChallenge {
    codeVerifier: string;
    codeChallenge: string;
    state: string;
}
export declare function generatePKCEChallenge(): PKCEChallenge;
//# sourceMappingURL=pkce.d.ts.map