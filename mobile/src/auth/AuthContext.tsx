import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, readSession, writeSession } from "../lib/tokenStore";

type AuthContextValue = {
  token: string | null;
  phone: string | null;
  ready: boolean;
  signIn: (token: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readSession()
      .then((session) => {
        if (cancelled) return;
        setToken(session.token);
        setPhone(session.phone);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      phone,
      ready,
      signIn: async (nextToken, nextPhone) => {
        await writeSession(nextToken, nextPhone);
        setToken(nextToken);
        setPhone(nextPhone);
      },
      signOut: async () => {
        await clearSession();
        setToken(null);
        setPhone(null);
      },
    }),
    [token, phone, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
