import { logger } from "../logger";

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Replace console methods
Object.assign(console, mockConsole);

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log error messages", () => {
    const message = "Test error message";
    const meta = { userId: "123" };

    logger.error(message, meta);

    expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("ERROR: Test error message"));
  });

  it("should log warning messages", () => {
    const message = "Test warning message";

    logger.warn(message);

    expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining("WARN: Test warning message"));
  });

  it("should log info messages", () => {
    const message = "Test info message";

    logger.info(message);

    expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("INFO: Test info message"));
  });

  it("should include metadata in log messages", () => {
    const message = "Test message";
    const meta = { key: "value", number: 42 };

    logger.info(message, meta);

    expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(meta)));
  });

  it("should format log messages with timestamp", () => {
    const message = "Test message";

    logger.info(message);

    expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/));
  });
});
