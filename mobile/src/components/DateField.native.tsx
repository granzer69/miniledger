import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { dateToIso, formatDisplayDate, parseIsoDate } from "../lib/dates";
import { colors } from "../theme";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateField({ value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(Platform.OS === "ios");
  const selected = isoToLocalDate(value);

  return (
    <View>
      <Text style={styles.label}>Due date</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.input}>
        <Text style={styles.value}>{parseIsoDate(value) ? formatDisplayDate(value) : "Choose a date"}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          mode="date"
          onChange={(event, date) => {
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "dismissed" || !date) return;
            onChange(dateToIso(date));
          }}
          value={selected}
        />
      ) : null}
    </View>
  );
}

function isoToLocalDate(value: string): Date {
  const parsed = parseIsoDate(value);
  if (!parsed) return new Date();
  const [year, month, day] = parsed.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const styles = StyleSheet.create({
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
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 14,
  },
  value: {
    color: colors.ink,
    fontSize: 16,
  },
});
