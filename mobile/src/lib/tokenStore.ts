import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "miniledger_token";
const PHONE_KEY = "miniledger_phone";

export async function readSession(): Promise<{ token: string | null; phone: string | null }> {
  if (Platform.OS === "web") {
    return {
      token: window.localStorage.getItem(TOKEN_KEY),
      phone: window.localStorage.getItem(PHONE_KEY),
    };
  }

  const [token, phone] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(PHONE_KEY),
  ]);
  return { token, phone };
}

export async function writeSession(token: string, phone: string): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(PHONE_KEY, phone);
    return;
  }

  await Promise.all([SecureStore.setItemAsync(TOKEN_KEY, token), SecureStore.setItemAsync(PHONE_KEY, phone)]);
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PHONE_KEY);
    return;
  }

  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(PHONE_KEY)]);
}
