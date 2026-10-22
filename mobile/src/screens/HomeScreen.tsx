import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { AddEntryModal } from "../components/AddEntryModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoanRow } from "../components/LoanRow";
import { SummaryCard } from "../components/SummaryCard";
import { ApiError, getLoans, getSummary, repayLoan, type Loan, type Summary } from "../lib/api";
import { todayInKolkata } from "../lib/dates";
import { formatPhone } from "../lib/phone";
import { colors, displayFont } from "../theme";

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
        <Pressable accessibilityRole="button" onPress={() => void signOut()}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load("refresh")}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.green} size="large" style={styles.loader} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={loans}
          keyExtractor={(loan) => loan.id}
          ListEmptyComponent={
            error ? undefined : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyBody}>When you lend money to a friend, it will show up here.</Text>
              </View>
            )
          }
          ListHeaderComponent={<SummaryCard summary={summary} />}
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
        <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.add}>
          <Text style={styles.addText}>Add entry</Text>
        </Pressable>
      </View>

      <AddEntryModal
        onClose={() => setAdding(false)}
        onCreated={() => {
          setAdding(false);
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  mark: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 28,
  },
  phone: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  logout: {
    color: colors.green,
    fontWeight: "700",
  },
  error: {
    color: colors.overdue,
    flex: 1,
  },
  errorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  retry: {
    color: colors.green,
    fontWeight: "700",
  },
  loader: {
    marginTop: 48,
  },
  list: {
    paddingBottom: 110,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  empty: {
    paddingTop: 12,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  footer: {
    bottom: 0,
    left: 0,
    padding: 16,
    position: "absolute",
    right: 0,
  },
  add: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 52,
  },
  addText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "700",
  },
});
