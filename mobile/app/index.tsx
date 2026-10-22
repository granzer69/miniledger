import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { LoginScreen } from "../src/screens/LoginScreen";
import { colors } from "../src/theme";

export default function Index() {
  const { token, ready } = useAuth();
  if (!ready) return <ActivityIndicator color={colors.green} style={styles.loader} />;
  if (token) return <Redirect href="/home" />;
  return <LoginScreen />;
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 80,
  },
});
