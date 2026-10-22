import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { formatRupeesFromPaise, rupeesToPaise } from "../src/lib/money";
import { isOverdue, shiftIsoDate } from "../src/lib/dates";
import { normalizeIndianPhone } from "../src/lib/phone";
import { normalizeFriendName } from "../src/lib/names";

const baseEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://miniledger:miniledger@localhost:5432/miniledger_test",
  JWT_SECRET: "test-jwt-secret-16chars",
  PORT: "4000",
};

describe("config", () => {
  it("refuses a fixed OTP code in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        NODE_ENV: "production",
        OTP_FIXED_CODE: "123456",
      }),
    ).toThrow(/OTP_FIXED_CODE/);
  });

  it("rejects a short JWT secret", () => {
    expect(() => loadConfig({ ...baseEnv, JWT_SECRET: "short" })).toThrow(/Invalid environment/);
  });
});

describe("money, phone, and dates", () => {
  it("converts rupees to paise without binary fractions", () => {
    expect(rupeesToPaise("1500.50")).toBe(150050);
    expect(rupeesToPaise("0.01")).toBe(1);
    expect(rupeesToPaise("0")).toBeNull();
    expect(rupeesToPaise("1.234")).toBeNull();
    expect(rupeesToPaise("10000001")).toBeNull();
  });

  it("formats paise in Indian grouping", () => {
    expect(formatRupeesFromPaise(0)).toBe("₹0.00");
    expect(formatRupeesFromPaise(150050)).toBe("₹1,500.50");
    expect(formatRupeesFromPaise(10000000)).toBe("₹1,00,000.00");
  });

  it("normalizes Indian mobiles and friend names", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("5876543210")).toBeNull();
    expect(normalizeFriendName("  सीता   Sharma ")).toBe("सीता Sharma");
    expect(normalizeFriendName("123")).toBeNull();
  });

  it("treats a due date before today as overdue only while it is unpaid", () => {
    const today = "2026-10-22";
    const yesterday = shiftIsoDate(today, -1);
    expect(isOverdue(yesterday, null, today)).toBe(true);
    expect(isOverdue(today, null, today)).toBe(false);
    expect(isOverdue(yesterday, new Date(), today)).toBe(false);
  });
});
