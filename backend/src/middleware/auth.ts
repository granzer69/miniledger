import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AppError } from "../lib/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHORIZED", "Sign in required"));
    return;
  }

  try {
    const payload = jwt.verify(header.slice("Bearer ".length), config.jwtSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new Error("Invalid token payload");
    }
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "Sign in required"));
  }
}
