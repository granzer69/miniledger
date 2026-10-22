import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_FIXED_CODE: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length === 0 ? undefined : trimmed;
    })
    .pipe(z.string().regex(/^\d{6}$/).optional()),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  otpFixedCode?: string;
  uploadDir: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }

  if (parsed.data.NODE_ENV === "production" && parsed.data.OTP_FIXED_CODE) {
    throw new Error("OTP_FIXED_CODE cannot be set when NODE_ENV is production");
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    databaseUrl: parsed.data.DATABASE_URL,
    jwtSecret: parsed.data.JWT_SECRET,
    otpTtlSeconds: parsed.data.OTP_TTL_SECONDS,
    otpMaxAttempts: parsed.data.OTP_MAX_ATTEMPTS,
    otpFixedCode: parsed.data.OTP_FIXED_CODE,
    uploadDir: parsed.data.UPLOAD_DIR,
  };
}

export const config = loadConfig();
