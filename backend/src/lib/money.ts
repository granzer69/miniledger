const AMOUNT = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export const MAX_RUPEES = 10_000_000;

export function rupeesToPaise(input: string): number | null {
  const value = input.trim();
  if (!AMOUNT.test(value)) return null;

  const [whole, fraction = ""] = value.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise <= 0 || paise > MAX_RUPEES * 100) return null;
  return paise;
}

export function formatRupeesFromPaise(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}₹${rupees.toLocaleString("en-IN")}.${fraction}`;
}
