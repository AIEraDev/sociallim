"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePKCEChallenge = generatePKCEChallenge;
const crypto_1 = __importDefault(require("crypto"));
function generatePKCEChallenge() {
    const codeVerifier = crypto_1.default.randomBytes(32).toString("base64url");
    const codeChallenge = crypto_1.default.createHash("sha256").update(codeVerifier).digest("base64url");
    const state = crypto_1.default.randomBytes(16).toString("base64url");
    return { codeVerifier, codeChallenge, state };
}
//# sourceMappingURL=pkce.js.map