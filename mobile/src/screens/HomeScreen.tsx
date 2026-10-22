import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { AddEntryModal } from "../components/AddEntryModal";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoanRow } from "../components/LoanRow";
import { SummaryCard } from "../components/SummaryCard";
import { ApiError, getLoans, getSummary, repayLoan, type Loan, type Summary } from "../lib/api";
import { todayInKolkata } from "../lib/dates";
import { formatPhone } from "../lib/phone";
import { deriveStatus } from "../lib/status";
import { colors, displayFont } from "../theme";

const filters = ["all", "open", "overdue", "repaid"] as const;
type Filter = (typeof filters)[number];

const filterLabel: Record<Filter, string> = {
  all: "All",
  open: "Open",
  overdue: "Overdue",
  repaid: "Repaid",
};

export function HomeScreen() {
  const { token, phone, signOut } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Loan | null>(null);
  const [repaying, setRepaying] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const today = todayInKolkata();

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!token) return;
      if (mode === "refresh") setRefreshing(true);
      try {
        const [nextSummary, nextLoans] = await Promise.all([getSummary(token), getLoans(token)]);
        setSummary(nextSummary);
        setLoans(nextLoans.loans);
        setError(null);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          await signOut();
          return;
        }
        setError(caught instanceof ApiError ? caught.message : "Couldn't load your ledger");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [signOut, token],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const visible = useMemo(
    () => loans.filter((loan) => filter === "all" || deriveStatus(loan.dueDate, loan.repaidAt, today) === filter),
    [filter, loans, today],
  );

  async function confirmRepay() {
    if (!token || !pending) return;
    setRepaying(true);
    try {
      await repayLoan(token, pending.id);
      setPending(null);
      await load("refresh");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't mark that entry repaid");
      setPending(null);
    } finally {
      setRepaying(false);
    }
  }

  if (!token) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.mark}>MiniLedger</Text>
          <Text style={styles.phone}>{phone ? formatPhone(phone) : ""}</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void signOut()} style={styles.logoutHit}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void load("refresh")} style={styles.retryHit}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.green} size="large" style={styles.loader} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={visible}
          keyExtractor={(loan) => loan.id}
          ListEmptyComponent={error ? undefined : <EmptyState filtered={loans.length > 0} filter={filter} />}
          ListHeaderComponent={
            <View>
              <SummaryCard summary={summary} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Entries</Text>
                <Text style={styles.count}>{loans.length}</Text>
              </View>
              <View style={styles.filters}>
                {filters.map((item) => (
                  <FilterChip active={filter === item} key={item} label={filterLabel[item]} onPress={() => setFilter(item)} />
                ))}
              </View>
            </View>
          }
          refreshControl={<RefreshControl onRefresh={() => void load("refresh")} refreshing={refreshing} tintColor={colors.green} />}
          renderItem={({ item }) => (
            <LoanRow
              amount={item.amount}
              dueDate={item.dueDate}
              friendName={item.friendName}
              hasReceipt={item.hasReceipt}
              loanId={item.id}
              onRepay={() => setPending(item)}
              repaidAt={item.repaidAt}
              today={today}
              token={token}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Button label="Add entry" onPress={() => setAdding(true)} />
      </View>

      <AddEntryModal
        onClose={() => setAdding(false)}
        onCreated={() => {
          setAdding(false);
          setFilter("all");
          void load("refresh");
        }}
        token={token}
        visible={adding}
      />
      <ConfirmDialog
        body={pending ? `Mark ${pending.amount} lent to ${pending.friendName} as repaid?` : ""}
        busy={repaying}
        confirmLabel="Mark repaid"
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmRepay()}
        title="Mark as repaid"
        visible={pending != null}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ filtered, filter }: { filtered: boolean; filter: Filter }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{filtered ? `No ${filterLabel[filter].toLowerCase()} entries` : "No entries yet"}</Text>
      <Text style={styles.emptyBody}>
        {filtered ? "Try another filter, or add a new entry." : "When you lend money to a friend, it will show up here."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  mark: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 30,
  },
  phone: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  logoutHit: {
    justifyContent: "center",
    minHeight: 44,
  },
  logout: {
    color: colors.green,
    fontWeight: "700",
  },
  error: {
    color: colors.overdue,
    flex: 1,
    lineHeight: 20,
  },
  errorRow: {
    alignItems: "center",
    backgroundColor: colors.overdueSoft,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryHit: {
    justifyContent: "center",
    minHeight: 44,
  },
  retry: {
    color: colors.green,
    fontWeight: "700",
  },
  loader: {
    marginTop: 48,
  },
  list: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  count: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.cream,
  },
  empty: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 22,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  footer: {
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: "absolute",
    right: 0,
  },
});
