export type EntryStatus = "overdue" | "open" | "repaid";

export function deriveStatus(dueDate: string, repaidAt: string | null, today: string): EntryStatus {
  if (repaidAt) return "repaid";
  if (dueDate < today) return "overdue";
  return "open";
}

export function statusLabel(status: EntryStatus): string {
  if (status === "overdue") return "Overdue";
  if (status === "repaid") return "Repaid";
  return "Open";
}
