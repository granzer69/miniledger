import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 60000,
    testTimeout: 20000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://miniledger:miniledger@localhost:5432/miniledger_test",
      JWT_SECRET: "test-jwt-secret-16chars",
      OTP_FIXED_CODE: "123456",
      OTP_TTL_SECONDS: "300",
      UPLOAD_DIR: path.resolve(process.cwd(), "uploads-test"),
      PORT: "4000",
    },
  },
});
