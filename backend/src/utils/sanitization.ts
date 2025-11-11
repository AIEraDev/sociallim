import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  normalizeWhitespace?: boolean;
  removeControlChars?: boolean;
}

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeText(input: string, options: SanitizationOptions = {}): string {
  if (typeof input !== "string") {
    return "";
  }

  const { allowHtml = false, maxLength = 10000, trimWhitespace = true, normalizeWhitespace = true, removeControlChars = true } = options;

  let sanitized = input;

  // Remove control characters (except newlines and tabs if HTML is allowed)
  if (removeControlChars) {
    if (allowHtml) {
      // Keep newlines and tabs for HTML content
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    } else {
      // Remove all control characters except space, tab, and newline
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    }
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    // Replace multiple consecutive whitespace with single space
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Handle HTML content
  if (allowHtml) {
    // Use DOMPurify to sanitize HTML and prevent XSS
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p", "a"],
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
    });
  } else {
    // Escape HTML entities
    sanitized = validator.escape(sanitized);
  }

  // Truncate to maximum length
  if (maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  // Normalize and validate email
  const normalized = validator.normalizeEmail(email, {
    gmail_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_lowercase: true,
    outlookdotcom_remove_subaddress: false,
    yahoo_lowercase: true,
    yahoo_remove_subaddress: false,
    icloud_lowercase: true,
    icloud_remove_subaddress: false,
  });

  return normalized || "";
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string, allowedProtocols: string[] = ["http", "https"]): string {
  if (typeof url !== "string") {
    return "";
  }

  // Remove whitespace and control characters
  let sanitized = url.trim().replace(/[\x00-\x1F\x7F]/g, "");

  // Validate URL format
  if (
    !validator.isURL(sanitized, {
      protocols: allowedProtocols,
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    })
  ) {
    return "";
  }

  return sanitized;
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string") {
    return "";
  }

  // Remove path traversal attempts and dangerous characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove dangerous characters
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\.+$/, "") // Remove trailing dots
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 255); // Limit length

  // Ensure filename is not empty after sanitization
  if (!sanitized) {
    sanitized = "file";
  }

  return sanitized;
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson(input: any): any {
  if (input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeJson);
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(input)) {
    // Prevent prototype pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeJson(value);
  }

  return sanitized;
}

/**
 * Sanitize SQL-like input to prevent injection (basic protection)
 */
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, "") // Remove quotes and backslashes
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*/g, "") // Remove block comment start
    .replace(/\*\//g, "") // Remove block comment end
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, "") // Remove SQL keywords
    .trim();
}

/**
 * Sanitize search query input
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") {
    return "";
  }

  return sanitizeText(query, {
    allowHtml: false,
    maxLength: 100,
    trimWhitespace: true,
    normalizeWhitespace: true,
    removeControlChars: true,
  });
}

/**
 * Sanitize user input for display (preserves some formatting)
 */
export function sanitizeUserContent(content: string): string {
  if (typeof content !== "string") {
    return "";
  }

  return sanitizeText(content, {
    allowHtml: true,
    maxLength: 5000,
    trimWhitespace: true,
    normalizeWhitespace: false, // Preserve formatting
    removeControlChars: true,
  });
}

/**
 * Middleware to sanitize request body
 */
export const sanitizeRequestBody = (options: SanitizationOptions = {}) => {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObjectRecursively(req.body, options);
    }
    next();
  };
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObjectRecursively(obj: any, options: SanitizationOptions): any {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeText(obj, options);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectRecursively(item, options));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip prototype pollution keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    sanitized[key] = sanitizeObjectRecursively(value, options);
  }

  return sanitized;
}

/**
 * Validate and sanitize common data types
 */
export const sanitizers = {
  text: (input: string, maxLength = 1000) => sanitizeText(input, { maxLength, allowHtml: false }),

  html: (input: string, maxLength = 5000) => sanitizeText(input, { maxLength, allowHtml: true }),

  email: sanitizeEmail,

  url: (input: string) => sanitizeUrl(input, ["http", "https"]),

  filename: sanitizeFilename,

  search: sanitizeSearchQuery,

  userContent: sanitizeUserContent,

  json: sanitizeJson,

  sql: sanitizeSqlInput,
};
