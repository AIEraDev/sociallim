"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../encryption");
const originalEnv = process.env.ENCRYPTION_KEY;
describe("Encryption Utils", () => {
    beforeEach(() => {
        process.env.ENCRYPTION_KEY = "test-encryption-key-32-characters-long";
    });
    afterEach(() => {
        process.env.ENCRYPTION_KEY = originalEnv;
    });
    describe("encrypt", () => {
        it("should encrypt a string", () => {
            const plaintext = "test-access-token";
            const encrypted = (0, encryption_1.encrypt)(plaintext);
            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted.length).toBeGreaterThan(0);
        });
        it("should return empty string for empty input", () => {
            const result = (0, encryption_1.encrypt)("");
            expect(result).toBe("");
        });
        it("should handle null/undefined input", () => {
            expect((0, encryption_1.encrypt)(null)).toBe("");
            expect((0, encryption_1.encrypt)(undefined)).toBe("");
        });
    });
    describe("decrypt", () => {
        it("should decrypt an encrypted string", () => {
            const plaintext = "test-access-token";
            const encrypted = (0, encryption_1.encrypt)(plaintext);
            const decrypted = (0, encryption_1.decrypt)(encrypted);
            expect(decrypted).toBe(plaintext);
        });
        it("should return empty string for empty input", () => {
            const result = (0, encryption_1.decrypt)("");
            expect(result).toBe("");
        });
        it("should handle invalid encrypted data", () => {
            expect(() => (0, encryption_1.decrypt)("invalid-encrypted-data")).toThrow("Failed to decrypt data");
        });
    });
    describe("validateEncryptionKey", () => {
        it("should validate a proper encryption key", () => {
            expect(() => (0, encryption_1.validateEncryptionKey)()).not.toThrow();
        });
        it("should throw error for default key", () => {
            process.env.ENCRYPTION_KEY = "default-key-change-in-production";
            expect(() => (0, encryption_1.validateEncryptionKey)()).toThrow("ENCRYPTION_KEY must be set in environment variables");
        });
        it("should throw error for short key", () => {
            process.env.ENCRYPTION_KEY = "short-key";
            expect(() => (0, encryption_1.validateEncryptionKey)()).toThrow("ENCRYPTION_KEY must be at least 32 characters long");
        });
        it("should throw error for missing key", () => {
            delete process.env.ENCRYPTION_KEY;
            expect(() => (0, encryption_1.validateEncryptionKey)()).toThrow("ENCRYPTION_KEY must be set in environment variables");
        });
    });
});
//# sourceMappingURL=encryption.test.js.map