import { z } from "zod";
import { AppError } from "../../lib/errors";
import { normalizeIndianPhone } from "../../lib/phone";

const phoneField = z.string().trim().min(1, "Enter a mobile number").transform((value, ctx) => {
  const phone = normalizeIndianPhone(value);
  if (!phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Indian mobile number" });
    return z.NEVER;
  }
  return phone;
});

export const requestOtpSchema = z.object({
  phone: phoneField,
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export function parseInput<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0]?.message ?? "Invalid input");
  }
  return result.data;
}
