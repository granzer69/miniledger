import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateField({ value, onChange }: DateFieldProps) {
  return (
    <View>
      <Text style={styles.label}>Due date</Text>
      <TextInput
        accessibilityLabel="Due date"
        autoCapitalize="none"
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#A39B90"
        style={styles.input}
        value={value}
      />
    </View>
  );
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
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
});
