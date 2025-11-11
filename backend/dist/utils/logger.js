"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVELS = {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
};
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === "development";
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
    error(message, meta) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
    info(message, meta) {
        console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
    debug(message, meta) {
        if (this.isDevelopment) {
            console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map