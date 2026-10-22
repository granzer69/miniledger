import { describe, expect, it } from "vitest";
import { shiftIsoDate } from "./dates";
import { formatRupeesFromPaise, rupeesToPaise, sanitizeAmount } from "./money";
import { normalizeIndianPhone, formatPhone } from "./phone";
import { deriveStatus, statusLabel } from "./status";

describe("ledger helpers", () => {
  it("normalizes Indian mobile numbers", () => {
    expect(normalizeIndianPhone("98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91-91234-56789")).toBe("+919123456789");
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });

  it("parses and formats rupees", () => {
    expect(sanitizeAmount("₹1,500.50")).toBe("1500.50");
    expect(rupeesToPaise("1500.50")).toBe(150050);
    expect(rupeesToPaise("0")).toBeNull();
    expect(rupeesToPaise("1.234")).toBeNull();
    expect(formatRupeesFromPaise(0)).toBe("₹0.00");
    expect(formatRupeesFromPaise(150050)).toBe("₹1,500.50");
    expect(formatRupeesFromPaise(10000000)).toBe("₹1,00,000.00");
  });

  it("labels overdue, open, and repaid entries", () => {
    const today = "2026-10-22";
    expect(deriveStatus(shiftIsoDate(today, -1), null, today)).toBe("overdue");
    expect(deriveStatus(today, null, today)).toBe("open");
    expect(deriveStatus(shiftIsoDate(today, 3), null, today)).toBe("open");
    expect(deriveStatus(shiftIsoDate(today, -1), "2026-10-22T00:00:00.000Z", today)).toBe("repaid");
    expect(statusLabel("overdue")).toBe("Overdue");
    expect(statusLabel("open")).toBe("Open");
    expect(statusLabel("repaid")).toBe("Repaid");
  });
});
