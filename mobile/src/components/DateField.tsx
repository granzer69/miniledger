import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, inputStyle } from "../theme";

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
        placeholderTextColor={colors.faint}
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
  input: inputStyle,
});
