import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "quiet";
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled = false, tone = "primary", style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "primary" ? styles.primary : null,
        tone === "secondary" ? styles.secondary : null,
        tone === "quiet" ? styles.quiet : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, tone === "primary" ? styles.primaryLabel : styles.inkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.green,
  },
  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
  },
  quiet: {
    backgroundColor: "transparent",
    minHeight: 44,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryLabel: {
    color: colors.cream,
  },
  inkLabel: {
    color: colors.ink,
  },
});
