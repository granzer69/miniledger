import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { HomeScreen } from "../src/screens/HomeScreen";
import { colors } from "../src/theme";

export default function HomeRoute() {
  const { token, ready } = useAuth();
  if (!ready) return <ActivityIndicator color={colors.green} style={styles.loader} />;
  if (!token) return <Redirect href="/" />;
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 80,
  },
});
