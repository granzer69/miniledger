import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ visible, title, body, confirmLabel, busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onCancel} style={styles.secondary}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onConfirm} style={styles.primary}>
              <Text style={styles.primaryText}>{busy ? "Saving…" : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(28, 25, 21, 0.4)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 20,
    maxWidth: 420,
    padding: 20,
    width: "100%",
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondary: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: "700",
  },
  primary: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  primaryText: {
    color: colors.cream,
    fontWeight: "700",
  },
});
