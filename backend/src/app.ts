import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./modules/auth/routes";
import { loansRouter } from "./modules/loans/routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      if (req.path === "/health") return;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", loansRouter);
  app.use(errorHandler);
  return app;
}
