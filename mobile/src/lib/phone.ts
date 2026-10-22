const INDIAN_MOBILE = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export function normalizeIndianPhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  const match = compact.match(INDIAN_MOBILE);
  if (!match) return null;
  return `+91${match[1]}`;
}

export function formatPhone(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return phone;
  const digits = normalized.slice(3);
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function phoneDigits(input: string): string {
  const compact = input.replace(/[^\d]/g, "");
  if (compact.length > 10 && compact.startsWith("91")) return compact.slice(2, 12);
  if (compact.startsWith("0")) return compact.slice(1, 11);
  return compact.slice(0, 10);
}
