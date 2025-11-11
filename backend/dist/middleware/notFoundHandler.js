"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res, next) => {
    const error = {
        message: `Route ${req.originalUrl} not found`,
        status: 404,
        timestamp: new Date().toISOString(),
    };
    res.status(404).json({ error });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map