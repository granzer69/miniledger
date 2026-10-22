const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayInKolkata(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseIsoDate(value: string): Date | null {
  const match = value.match(ISO_DATE);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) throw new Error(`Invalid date: ${isoDate}`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return formatIsoDate(parsed);
}

export function isOverdue(dueDate: string, repaidAt: Date | null, today = todayInKolkata()): boolean {
  return repaidAt == null && dueDate < today;
}
