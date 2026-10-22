import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, requestOtp, verifyOtp } from "../lib/api";
import { normalizeIndianPhone, phoneDigits } from "../lib/phone";
import { colors, displayFont } from "../theme";
import { useAuth } from "../auth/AuthContext";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalized = normalizeIndianPhone(phone);

  async function sendCode() {
    if (!normalized) {
      setError("Enter a valid Indian mobile number");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestOtp(normalized);
      setStep("code");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't send a code");
    } finally {
      setSubmitting(false);
    }
  }

  async function verify() {
    if (!normalized) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyOtp(normalized, code);
      await signIn(result.token, result.user.phone);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't verify that code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.copy}>
        <Text style={styles.mark}>MiniLedger</Text>
        <Text style={styles.lede}>Track money you've lent to friends, and notice what is overdue.</Text>
      </View>

      {step === "phone" ? (
        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              accessibilityLabel="Mobile number"
              keyboardType="phone-pad"
              onChangeText={(value) => setPhone(phoneDigits(value))}
              placeholder="98765 43210"
              placeholderTextColor="#A39B90"
              style={styles.phoneInput}
              value={phone}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void sendCode()} style={styles.button}>
            <Text style={styles.buttonText}>{submitting ? "Sending…" : "Send code"}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>One-time code</Text>
          <Text style={styles.hint}>
            A code for +91 {phone} was printed in the API server log. It is not shown here.
          </Text>
          <TextInput
            accessibilityLabel="One-time code"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="#A39B90"
            style={styles.codeInput}
            value={code}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void verify()} style={styles.button}>
            <Text style={styles.buttonText}>{submitting ? "Checking…" : "Continue"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCode("");
              setError(null);
              void sendCode();
            }}
          >
            <Text style={styles.link}>Resend code</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  copy: {
    marginBottom: 28,
  },
  mark: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 42,
    lineHeight: 48,
  },
  lede: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 10,
  },
  form: {
    gap: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  phoneRow: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  prefix: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  phoneInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    minHeight: 52,
  },
  codeInput: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 32,
    letterSpacing: 8,
    minHeight: 64,
    paddingHorizontal: 14,
    textAlign: "center",
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: colors.overdue,
    fontSize: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 52,
  },
  buttonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: colors.green,
    fontWeight: "700",
    textAlign: "center",
  },
});
