import { Router } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../../config";
import { asyncHandler } from "../../lib/asyncHandler";
import { parseInput, requestOtpSchema, verifyOtpSchema } from "./schemas";
import { requestOtp, verifyOtp } from "./service";

export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === "test",
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many code requests. Wait a few minutes and try again.",
      },
    });
  },
});

export const authRouter = Router();

authRouter.post(
  "/request-otp",
  otpRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseInput(requestOtpSchema, req.body);
    const result = await requestOtp(input.phone);
    res.status(200).json({ ok: true, expiresInSeconds: result.expiresInSeconds });
  }),
);

authRouter.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const input = parseInput(verifyOtpSchema, req.body);
    const result = await verifyOtp(input.phone, input.code);
    res.status(200).json(result);
  }),
);
