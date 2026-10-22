const INDIAN_MOBILE = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export function normalizeIndianPhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  const match = compact.match(INDIAN_MOBILE);
  if (!match) return null;
  return `+91${match[1]}`;
}
