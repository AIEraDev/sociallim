import crypto from "crypto";

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * Generate PKCE challenge for OAuth 2.0
 */
export function generatePKCEChallenge(): PKCEChallenge {
  // Generate code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  // Generate code challenge (SHA256 hash of verifier)
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString("base64url");

  return { codeVerifier, codeChallenge, state };
}
