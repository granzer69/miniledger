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
      <View style={[styles.rail, railStyle(status)]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.identity}>
            <View style={[styles.mark, status === "overdue" ? styles.markOverdue : null]}>
              <Text style={styles.markText}>{initial(friendName)}</Text>
            </View>
            <View style={styles.nameBlock}>
              <Text numberOfLines={1} style={[styles.name, status === "repaid" ? styles.repaidText : null]}>
                {friendName}
              </Text>
              <Text style={styles.due}>Due {formatDisplayDate(dueDate)}</Text>
            </View>
          </View>
          <View style={styles.amountBlock}>
            <Text style={[styles.amount, status === "repaid" ? styles.repaidText : null]}>{amount}</Text>
            <Text style={[styles.badge, badgeStyle(status)]}>{statusLabel(status)}</Text>
          </View>
        </View>
        {hasReceipt ? <ReceiptThumb loanId={loanId} token={token} /> : null}
        {status === "repaid" ? null : (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={onRepay}
            style={({ pressed }) => [styles.repay, pressed ? styles.pressed : null]}
          >
            <Text style={styles.repayText}>Mark repaid</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase() || "•";
}

function railStyle(status: EntryStatus) {
  if (status === "overdue") return styles.railOverdue;
  if (status === "repaid") return styles.railRepaid;
  return styles.railOpen;
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

  return (
    <View style={styles.receipt}>
      {uri ? (
        <Image accessibilityLabel="Receipt" source={{ uri }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder} />
      )}
      <Text style={styles.receiptLabel}>Receipt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  overdue: {
    backgroundColor: colors.overdueSoft,
    borderColor: colors.overdueLine,
  },
  repaid: {
    opacity: 0.78,
  },
  rail: {
    width: 5,
  },
  railOpen: {
    backgroundColor: colors.green,
  },
  railOverdue: {
    backgroundColor: colors.overdue,
  },
  railRepaid: {
    backgroundColor: "#C9C1B4",
  },
  body: {
    flex: 1,
    padding: 14,
  },
  top: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  identity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  mark: {
    alignItems: "center",
    backgroundColor: colors.greenSoft,
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  markOverdue: {
    backgroundColor: "#F3D4CD",
  },
  markText: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 18,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 20,
  },
  amountBlock: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 18,
  },
  repaidText: {
    color: colors.muted,
  },
  due: {
    color: colors.muted,
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
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
    backgroundColor: colors.greenSoft,
    color: colors.green,
  },
  badgeRepaid: {
    backgroundColor: colors.repaidSoft,
    color: colors.muted,
  },
  receipt: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  thumb: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  thumbPlaceholder: {
    backgroundColor: "rgba(28, 25, 21, 0.06)",
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  receiptLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  repay: {
    alignSelf: "flex-start",
    marginTop: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  repayText: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "700",
  },
});
