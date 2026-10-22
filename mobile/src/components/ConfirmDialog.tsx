import { Modal, StyleSheet, Text, View } from "react-native";
import { colors, displayFont } from "../theme";
import { Button } from "./Button";

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
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.actions}>
            <Button disabled={busy} label="Cancel" onPress={onCancel} style={styles.action} tone="secondary" />
            <Button disabled={busy} label={busy ? "Saving…" : confirmLabel} onPress={onConfirm} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(28, 25, 21, 0.46)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 22,
    maxWidth: 420,
    padding: 22,
    width: "100%",
  },
  title: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 26,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  action: {
    flex: 1,
  },
});
