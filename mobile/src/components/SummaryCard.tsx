import { StyleSheet, Text, View } from "react-native";
import type { Summary } from "../lib/api";
import { colors, displayFont } from "../theme";

type SummaryCardProps = {
  summary: Summary | null;
};

export function SummaryCard({ summary }: SummaryCardProps) {
  const overdue = (summary?.overduePaise ?? 0) > 0;
  return (
    <View accessibilityRole="summary" style={styles.card}>
      <Text style={styles.kicker}>Still out</Text>
      <Text style={styles.hero}>{summary?.outstanding ?? "—"}</Text>
      <View style={styles.metrics}>
        <Metric label="Lent" value={summary?.totalLent ?? "—"} />
        <Metric label="Repaid" value={summary?.totalRepaid ?? "—"} />
        <Metric alert={overdue} label="Overdue" value={summary?.overdue ?? "—"} />
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
    borderRadius: 24,
    marginBottom: 22,
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  kicker: {
    color: "#D5E6DF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  hero: {
    color: colors.cream,
    fontFamily: displayFont,
    fontSize: 40,
    lineHeight: 48,
    marginBottom: 16,
    marginTop: 6,
  },
  metrics: {
    borderTopColor: "rgba(246, 241, 231, 0.18)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingTop: 14,
  },
  metric: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    color: "#D5E6DF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "700",
  },
  alert: {
    color: "#F3C1BA",
  },
});
