import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchReceipt } from "../lib/api";
import { formatDisplayDate } from "../lib/dates";
import { deriveStatus, statusLabel, type EntryStatus } from "../lib/status";
import { colors, displayFont } from "../theme";

type LoanRowProps = {
  friendName: string;
  amount: string;
  dueDate: string;
  repaidAt: string | null;
  hasReceipt: boolean;
  loanId: string;
  token: string;
  today: string;
  onRepay: () => void;
};

export function LoanRow({
  friendName,
  amount,
  dueDate,
  repaidAt,
  hasReceipt,
  loanId,
  token,
  today,
  onRepay,
}: LoanRowProps) {
  const status = deriveStatus(dueDate, repaidAt, today);
  return (
    <View style={[styles.card, status === "overdue" ? styles.overdue : null, status === "repaid" ? styles.repaid : null]}>
      <View style={styles.top}>
        <Text style={[styles.name, status === "repaid" ? styles.repaidText : null]}>{friendName}</Text>
        <Text style={[styles.amount, status === "repaid" ? styles.repaidText : null]}>{amount}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.due}>Due {formatDisplayDate(dueDate)}</Text>
        <Text style={[styles.badge, badgeStyle(status)]}>{statusLabel(status)}</Text>
      </View>
      {hasReceipt ? <ReceiptThumb loanId={loanId} token={token} /> : null}
      {status !== "repaid" ? (
        <Pressable accessibilityRole="button" onPress={onRepay} style={styles.repay}>
          <Text style={styles.repayText}>Mark repaid</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function badgeStyle(status: EntryStatus) {
  if (status === "overdue") return styles.badgeOverdue;
  if (status === "repaid") return styles.badgeRepaid;
  return styles.badgeOpen;
}

function ReceiptThumb({ loanId, token }: { loanId: string; token: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReceipt(token, loanId)
      .then((next) => {
        if (!cancelled) setUri(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loanId, token]);

  if (!uri) return <View style={styles.thumbPlaceholder} />;
  return <Image accessibilityLabel="Receipt" source={{ uri }} style={styles.thumb} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  overdue: {
    backgroundColor: colors.overdueSoft,
    borderColor: colors.overdueLine,
  },
  repaid: {
    opacity: 0.72,
  },
  top: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    color: colors.ink,
    flex: 1,
    fontFamily: displayFont,
    fontSize: 22,
  },
  amount: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  repaidText: {
    color: colors.muted,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  due: {
    color: colors.muted,
    fontSize: 14,
  },
  badge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  badgeOverdue: {
    backgroundColor: colors.overdue,
    color: "#FFF8F6",
  },
  badgeOpen: {
    backgroundColor: "#E7F3EE",
    color: colors.green,
  },
  badgeRepaid: {
    backgroundColor: "#EFEBE3",
    color: colors.muted,
  },
  thumb: {
    borderRadius: 12,
    height: 84,
    marginTop: 12,
    width: 84,
  },
  thumbPlaceholder: {
    backgroundColor: "rgba(28, 25, 21, 0.06)",
    borderRadius: 12,
    height: 84,
    marginTop: 12,
    width: 84,
  },
  repay: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingVertical: 4,
  },
  repayText: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "700",
  },
});
