import { StyleSheet, Text, View } from "react-native";
import type { Summary } from "../lib/api";
import { colors, displayFont } from "../theme";

type SummaryCardProps = {
  summary: Summary | null;
};

export function SummaryCard({ summary }: SummaryCardProps) {
  const overdue = (summary?.overduePaise ?? 0) > 0;
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>Still out</Text>
      <Text style={styles.hero}>{summary?.outstanding ?? "—"}</Text>
      <View style={styles.rows}>
        <Metric label="Lent" value={summary?.totalLent ?? "—"} />
        <Metric label="Repaid" value={summary?.totalRepaid ?? "—"} />
        <Metric label="Overdue" value={summary?.overdue ?? "—"} alert={overdue} />
      </View>
    </View>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, alert ? styles.alert : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.greenDark,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    marginBottom: 22,
  },
  kicker: {
    color: "#D5E6DF",
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hero: {
    color: colors.cream,
    fontFamily: displayFont,
    fontSize: 40,
    lineHeight: 48,
    marginTop: 4,
    marginBottom: 14,
  },
  rows: {
    borderTopWidth: 1,
    borderTopColor: "rgba(246, 241, 231, 0.16)",
  },
  metric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  metricLabel: {
    color: "#D5E6DF",
    fontSize: 15,
  },
  metricValue: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "600",
  },
  alert: {
    color: "#F3C1BA",
  },
});
