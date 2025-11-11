import { encrypt, decrypt, validateEncryptionKey } from "../encryption";

// Mock environment variable
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
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should return empty string for empty input", () => {
      const result = encrypt("");
      expect(result).toBe("");
    });

    it("should handle null/undefined input", () => {
      expect(encrypt(null as any)).toBe("");
      expect(encrypt(undefined as any)).toBe("");
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted string", () => {
      const plaintext = "test-access-token";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should return empty string for empty input", () => {
      const result = decrypt("");
      expect(result).toBe("");
    });

    it("should handle invalid encrypted data", () => {
      expect(() => decrypt("invalid-encrypted-data")).toThrow("Failed to decrypt data");
    });
  });

  describe("validateEncryptionKey", () => {
    it("should validate a proper encryption key", () => {
      expect(() => validateEncryptionKey()).not.toThrow();
    });

    it("should throw error for default key", () => {
      process.env.ENCRYPTION_KEY = "default-key-change-in-production";
      expect(() => validateEncryptionKey()).toThrow("ENCRYPTION_KEY must be set in environment variables");
    });

    it("should throw error for short key", () => {
      process.env.ENCRYPTION_KEY = "short-key";
      expect(() => validateEncryptionKey()).toThrow("ENCRYPTION_KEY must be at least 32 characters long");
    });

    it("should throw error for missing key", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => validateEncryptionKey()).toThrow("ENCRYPTION_KEY must be set in environment variables");
    });
  });
});
