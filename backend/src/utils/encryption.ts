import * as CryptoJS from "crypto-js";

/**
 * Get the encryption key from environment variables
 */
function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || "default-key-change-in-production";
}

/**
 * Encrypts a string using AES encryption
 * @param text - The text to encrypt
 * @returns The encrypted text
 */
export function encrypt(text: string): string {
  if (!text) return "";

  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string
 * @param encryptedText - The encrypted text to decrypt
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    // If decryption fails, result will be empty string
    if (!result && encryptedText) {
      throw new Error("Invalid encrypted data");
    }

    return result;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Validates that the encryption key is properly configured
 */
export function validateEncryptionKey(): void {
  const key = getEncryptionKey();

  if (!key || key === "default-key-change-in-production") {
    throw new Error("ENCRYPTION_KEY must be set in environment variables");
  }

  if (key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters long");
  }
}
