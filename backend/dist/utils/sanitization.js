"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizers = exports.sanitizeRequestBody = void 0;
exports.sanitizeText = sanitizeText;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizeUrl = sanitizeUrl;
exports.sanitizeFilename = sanitizeFilename;
exports.sanitizeJson = sanitizeJson;
exports.sanitizeSqlInput = sanitizeSqlInput;
exports.sanitizeSearchQuery = sanitizeSearchQuery;
exports.sanitizeUserContent = sanitizeUserContent;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const validator_1 = __importDefault(require("validator"));
function sanitizeText(input, options = {}) {
    if (typeof input !== "string") {
        return "";
    }
    const { allowHtml = false, maxLength = 10000, trimWhitespace = true, normalizeWhitespace = true, removeControlChars = true } = options;
    let sanitized = input;
    if (removeControlChars) {
        if (allowHtml) {
            sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
        }
        else {
            sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
        }
    }
    if (normalizeWhitespace) {
        sanitized = sanitized.replace(/\s+/g, " ");
    }
    if (trimWhitespace) {
        sanitized = sanitized.trim();
    }
    if (allowHtml) {
        sanitized = isomorphic_dompurify_1.default.sanitize(sanitized, {
            ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p", "a"],
            ALLOWED_ATTR: ["href", "title"],
            ALLOW_DATA_ATTR: false,
        });
    }
    else {
        sanitized = validator_1.default.escape(sanitized);
    }
    if (maxLength > 0 && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
}
function sanitizeEmail(email) {
    if (typeof email !== "string") {
        return "";
    }
    const normalized = validator_1.default.normalizeEmail(email, {
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
function sanitizeUrl(url, allowedProtocols = ["http", "https"]) {
    if (typeof url !== "string") {
        return "";
    }
    let sanitized = url.trim().replace(/[\x00-\x1F\x7F]/g, "");
    if (!validator_1.default.isURL(sanitized, {
        protocols: allowedProtocols,
        require_protocol: true,
        require_host: true,
        require_valid_protocol: true,
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
    })) {
        return "";
    }
    return sanitized;
}
function sanitizeFilename(filename) {
    if (typeof filename !== "string") {
        return "";
    }
    let sanitized = filename
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/^\.+/, "")
        .replace(/\.+$/, "")
        .replace(/\s+/g, "_")
        .substring(0, 255);
    if (!sanitized) {
        sanitized = "file";
    }
    return sanitized;
}
function sanitizeJson(input) {
    if (input === null || typeof input !== "object") {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map(sanitizeJson);
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }
        sanitized[key] = sanitizeJson(value);
    }
    return sanitized;
}
function sanitizeSqlInput(input) {
    if (typeof input !== "string") {
        return "";
    }
    return input
        .replace(/['";\\]/g, "")
        .replace(/--/g, "")
        .replace(/\/\*/g, "")
        .replace(/\*\//g, "")
        .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, "")
        .trim();
}
function sanitizeSearchQuery(query) {
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
function sanitizeUserContent(content) {
    if (typeof content !== "string") {
        return "";
    }
    return sanitizeText(content, {
        allowHtml: true,
        maxLength: 5000,
        trimWhitespace: true,
        normalizeWhitespace: false,
        removeControlChars: true,
    });
}
const sanitizeRequestBody = (options = {}) => {
    return (req, res, next) => {
        if (req.body && typeof req.body === "object") {
            req.body = sanitizeObjectRecursively(req.body, options);
        }
        next();
    };
};
exports.sanitizeRequestBody = sanitizeRequestBody;
function sanitizeObjectRecursively(obj, options) {
    if (obj === null || typeof obj !== "object") {
        if (typeof obj === "string") {
            return sanitizeText(obj, options);
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObjectRecursively(item, options));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }
        sanitized[key] = sanitizeObjectRecursively(value, options);
    }
    return sanitized;
}
exports.sanitizers = {
    text: (input, maxLength = 1000) => sanitizeText(input, { maxLength, allowHtml: false }),
    html: (input, maxLength = 5000) => sanitizeText(input, { maxLength, allowHtml: true }),
    email: sanitizeEmail,
    url: (input) => sanitizeUrl(input, ["http", "https"]),
    filename: sanitizeFilename,
    search: sanitizeSearchQuery,
    userContent: sanitizeUserContent,
    json: sanitizeJson,
    sql: sanitizeSqlInput,
};
//# sourceMappingURL=sanitization.js.map