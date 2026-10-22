import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ApiError, requestOtp, verifyOtp } from "../lib/api";
import { formatPhone, normalizeIndianPhone, phoneDigits } from "../lib/phone";
import { colors, displayFont, inputStyle } from "../theme";

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
        <Text style={styles.eyebrow}>Personal ledger</Text>
        <Text style={styles.mark}>MiniLedger</Text>
        <Text style={styles.lede}>Money you lend to friends, with the overdue amounts kept in sight.</Text>
      </View>

      {step === "phone" ? (
        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              accessibilityLabel="Mobile number"
              keyboardType="phone-pad"
              onChangeText={(value) => {
                setPhone(phoneDigits(value));
                setError(null);
              }}
              placeholder="98765 43210"
              placeholderTextColor={colors.faint}
              style={styles.phoneInput}
              value={phone}
            />
          </View>
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Button disabled={submitting} label={submitting ? "Sending…" : "Send code"} onPress={() => void sendCode()} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>One-time code</Text>
          <Text style={styles.hint}>
            The code for {normalized ? formatPhone(normalized) : phone} is in the API server log. It is not shown here.
          </Text>
          <TextInput
            accessibilityLabel="One-time code"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            placeholder="000000"
            placeholderTextColor={colors.faint}
            style={styles.codeInput}
            value={code}
          />
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Button disabled={submitting} label={submitting ? "Checking…" : "Continue"} onPress={() => void verify()} />
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setCode("");
                setError(null);
                void sendCode();
              }}
              style={styles.linkHit}
            >
              <Text style={styles.link}>Resend code</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              style={styles.linkHit}
            >
              <Text style={styles.linkMuted}>Change number</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  copy: {
    marginBottom: 32,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  mark: {
    color: colors.ink,
    fontFamily: displayFont,
    fontSize: 46,
    lineHeight: 52,
  },
  lede: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 340,
  },
  form: {
    gap: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
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
  },
  divider: {
    backgroundColor: colors.line,
    height: 22,
    marginHorizontal: 12,
    width: 1,
  },
  phoneInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    minHeight: 52,
  },
  codeInput: {
    ...inputStyle,
    fontFamily: displayFont,
    fontSize: 32,
    letterSpacing: 8,
    minHeight: 68,
    textAlign: "center",
  },
  hint: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: colors.overdue,
    fontSize: 14,
    lineHeight: 20,
  },
  links: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkHit: {
    justifyContent: "center",
    minHeight: 44,
  },
  link: {
    color: colors.green,
    fontWeight: "700",
  },
  linkMuted: {
    color: colors.muted,
    fontWeight: "700",
  },
});
