"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.validateEncryptionKey = validateEncryptionKey;
const CryptoJS = __importStar(require("crypto-js"));
function getEncryptionKey() {
    return process.env.ENCRYPTION_KEY || "default-key-change-in-production";
}
function encrypt(text) {
    if (!text)
        return "";
    try {
        const key = getEncryptionKey();
        const encrypted = CryptoJS.AES.encrypt(text, key).toString();
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
        const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
        const result = decrypted.toString(CryptoJS.enc.Utf8);
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