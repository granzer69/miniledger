import { Stack } from "expo-router";
import { useFonts, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/AuthContext";
import { colors } from "../src/theme";

export default function RootLayout() {
  const [loaded, error] = useFonts({ Fraunces_600SemiBold });

  return (
    <AuthProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.column}>
          {loaded || error ? (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
          ) : (
            <ActivityIndicator color={colors.green} style={styles.loader} />
          )}
        </View>
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.paper,
    flex: 1,
  },
  column: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
  },
  loader: {
    marginTop: 80,
  },
});
