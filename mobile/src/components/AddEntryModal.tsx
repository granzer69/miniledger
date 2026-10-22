import { useState, type ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ApiError, createLoan, type ReceiptUpload } from "../lib/api";
import { normalizeFriendName, parseIsoDate, shiftIsoDate, todayInKolkata } from "../lib/dates";
import { rupeesToPaise, sanitizeAmount } from "../lib/money";
import { colors, displayFont } from "../theme";
import { DateField } from "./DateField";

type AddEntryModalProps = {
  visible: boolean;
  token: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddEntryModal({ visible, token, onClose, onCreated }: AddEntryModalProps) {
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(shiftIsoDate(todayInKolkata(), 7));
  const [receipt, setReceipt] = useState<ReceiptUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetAndClose() {
    if (submitting) return;
    setFriendName("");
    setAmount("");
    setDueDate(shiftIsoDate(todayInKolkata(), 7));
    setReceipt(null);
    setError(null);
    onClose();
  }

  async function choosePhoto(source: "library" | "camera") {
    setError(null);
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Camera permission is needed to photograph a receipt.");
        return;
      }
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const upload: ReceiptUpload = { uri: asset.uri, mimeType: asset.mimeType };
    if (Platform.OS === "web") {
      const response = await fetch(asset.uri);
      upload.file = await response.blob();
    }
    setReceipt(upload);
  }

  async function submit() {
    const name = normalizeFriendName(friendName);
    const paise = rupeesToPaise(amount);
    const date = parseIsoDate(dueDate);
    if (!name) {
      setError("Enter a friend's name using letters, spaces, and . ' -");
      return;
    }
    if (paise == null) {
      setError("Enter an amount greater than 0, up to ₹1,00,00,000, with at most 2 decimal places");
      return;
    }
    if (!date) {
      setError("Enter a due date as YYYY-MM-DD");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createLoan(token, { friendName: name, amount: sanitizeAmount(amount), dueDate: date, receipt: receipt ?? undefined });
      setFriendName("");
      setAmount("");
      setDueDate(shiftIsoDate(todayInKolkata(), 7));
      setReceipt(null);
      onCreated();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't save that entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={resetAndClose} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>New entry</Text>
            <Pressable accessibilityRole="button" onPress={resetAndClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.intro}>Record money you lent. A past due date is allowed, so overdue loans can be added too.</Text>

          <Field label="Friend's name">
            <TextInput
              accessibilityLabel="Friend's name"
              onChangeText={setFriendName}
              placeholder="Rahul"
              placeholderTextColor="#A39B90"
              style={styles.input}
              value={friendName}
            />
          </Field>
          <Field label="Amount">
            <TextInput
              accessibilityLabel="Amount in rupees"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="1500.00"
              placeholderTextColor="#A39B90"
              style={styles.input}
              value={amount}
            />
          </Field>
          <DateField onChange={setDueDate} value={dueDate} />

          <Text style={styles.label}>Receipt</Text>
          {receipt ? (
            <View style={styles.previewRow}>
              <Image accessibilityLabel="Selected receipt" source={{ uri: receipt.uri }} style={styles.preview} />
              <Pressable accessibilityRole="button" onPress={() => setReceipt(null)}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoActions}>
              <Pressable accessibilityRole="button" onPress={() => void choosePhoto("library")} style={styles.secondary}>
                <Text style={styles.secondaryText}>Choose photo</Text>
              </Pressable>
              {Platform.OS === "web" ? null : (
                <Pressable accessibilityRole="button" onPress={() => void choosePhoto("camera")} style={styles.secondary}>
                  <Text style={styles.secondaryText}>Take photo</Text>
                </Pressable>
              )}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={styles.save}>
            <Text style={styles.saveText}>{submitting ? "Saving…" : "Save entry"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 32,
  },
  close: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "700",
  },
  intro: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondary: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: "700",
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  preview: {
    borderRadius: 12,
    height: 84,
    width: 84,
  },
  remove: {
    color: colors.overdue,
    fontWeight: "700",
  },
  error: {
    color: colors.overdue,
    fontSize: 14,
    lineHeight: 20,
  },
  save: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 14,
    marginTop: 4,
    minHeight: 52,
    justifyContent: "center",
  },
  saveText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "700",
  },
});
