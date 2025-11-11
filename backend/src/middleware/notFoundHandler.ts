import { Request, Response, NextFunction } from "express";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = {
    message: `Route ${req.originalUrl} not found`,
    status: 404,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json({ error });
};
