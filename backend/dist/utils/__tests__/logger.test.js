"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
const mockConsole = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
Object.assign(console, mockConsole);
describe("Logger", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should log error messages", () => {
        const message = "Test error message";
        const meta = { userId: "123" };
        logger_1.logger.error(message, meta);
        expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("ERROR: Test error message"));
    });
    it("should log warning messages", () => {
        const message = "Test warning message";
        logger_1.logger.warn(message);
        expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining("WARN: Test warning message"));
    });
    it("should log info messages", () => {
        const message = "Test info message";
        logger_1.logger.info(message);
        expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("INFO: Test info message"));
    });
    it("should include metadata in log messages", () => {
        const message = "Test message";
        const meta = { key: "value", number: 42 };
        logger_1.logger.info(message, meta);
        expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(meta)));
    });
    it("should format log messages with timestamp", () => {
        const message = "Test message";
        logger_1.logger.info(message);
        expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/));
    });
});
//# sourceMappingURL=logger.test.js.map