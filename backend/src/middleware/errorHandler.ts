import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
}
