import crypto from "node:crypto";
import { config } from "../config";

export function generateOtpCode(): string {
  if (config.otpFixedCode) return config.otpFixedCode;
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(phone: string, code: string): string {
  return crypto.createHash("sha256").update(`${config.jwtSecret}:${phone}:${code}`).digest("hex");
}

export function otpHashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
