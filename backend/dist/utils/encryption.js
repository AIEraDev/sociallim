"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.validateEncryptionKey = validateEncryptionKey;
const crypto_js_1 = __importDefault(require("crypto-js"));
function getEncryptionKey() {
    return process.env.ENCRYPTION_KEY || "default-key-change-in-production";
}
function encrypt(text) {
    if (!text)
        return "";
    try {
        const key = getEncryptionKey();
        const encrypted = crypto_js_1.default.AES.encrypt(text, key).toString();
        return encrypted;
    }
    catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
}
function decrypt(encryptedText) {
    if (!encryptedText)
        return "";
    try {
        const key = getEncryptionKey();
        const decrypted = crypto_js_1.default.AES.decrypt(encryptedText, key);
        const result = decrypted.toString(crypto_js_1.default.enc.Utf8);
        if (!result && encryptedText) {
            throw new Error("Invalid encrypted data");
        }
        return result;
    }
    catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}
function validateEncryptionKey() {
    const key = getEncryptionKey();
    if (!key || key === "default-key-change-in-production") {
        throw new Error("ENCRYPTION_KEY must be set in environment variables");
    }
    if (key.length < 32) {
        throw new Error("ENCRYPTION_KEY must be at least 32 characters long");
    }
}
//# sourceMappingURL=encryption.js.map