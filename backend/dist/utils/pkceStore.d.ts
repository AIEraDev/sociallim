interface PKCEData {
    codeVerifier: string;
    state: string;
    userId: string;
    createdAt: number;
}
export declare const PKCEStore: {
    set(state: string, data: Omit<PKCEData, "createdAt">): void;
    get(state: string): PKCEData | undefined;
    delete(state: string): boolean;
};
export {};
//# sourceMappingURL=pkceStore.d.ts.map