import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface User {
  name: string;
  phone: string;
  email?: string;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (
    phone: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    name: string,
    phone: string,
    password: string,
    email?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  sendOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, otp: string, expectedOtp: string) => boolean;
  resetPassword: (phone: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "quickbihar_user";
const ACCOUNTS_KEY = "quickbihar_accounts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setUser(JSON.parse(data));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveUser = useCallback(async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const getAccounts = async (): Promise<Record<string, string>> => {
    const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : {};
  };

  const saveAccounts = async (accounts: Record<string, string>) => {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  };

  const sendOtp = useCallback(async (_phone: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 800));
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }, []);

  const verifyOtp = useCallback(
    (_phone: string, otp: string, expectedOtp: string): boolean => {
      return otp === expectedOtp;
    },
    [],
  );

  const signIn = useCallback(
    async (phone: string, password: string) => {
      await new Promise((r) => setTimeout(r, 700));
      const accounts = await getAccounts();
      const stored = accounts[phone];
      if (!stored) {
        return { success: false, error: "No account found for this number." };
      }
      const parsed = JSON.parse(stored);
      if (parsed.password !== password) {
        return {
          success: false,
          error: "Incorrect password. Please try again.",
        };
      }
      const u: User = {
        name: parsed.name,
        phone,
        email: parsed.email,
        joinedAt: parsed.joinedAt,
      };
      await saveUser(u);
      return { success: true };
    },
    [saveUser],
  );

  const signUp = useCallback(
    async (name: string, phone: string, password: string, email?: string) => {
      await new Promise((r) => setTimeout(r, 700));
      const accounts = await getAccounts();
      if (accounts[phone]) {
        return {
          success: false,
          error: "An account with this number already exists.",
        };
      }
      const record = JSON.stringify({
        name,
        password,
        email,
        joinedAt: new Date().toISOString(),
      });
      accounts[phone] = record;
      await saveAccounts(accounts);
      const u: User = {
        name,
        phone,
        email,
        joinedAt: new Date().toISOString(),
      };
      await saveUser(u);
      return { success: true };
    },
    [saveUser],
  );

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      await saveUser(updated);
    },
    [user, saveUser],
  );

  const resetPassword = useCallback(
    async (phone: string, newPassword: string) => {
      const accounts = await getAccounts();
      if (!accounts[phone]) return false;
      const parsed = JSON.parse(accounts[phone]);
      parsed.password = newPassword;
      accounts[phone] = JSON.stringify(parsed);
      await saveAccounts(accounts);
      return true;
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
        sendOtp,
        verifyOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  signIn: async () => ({ success: false, error: "Not implemented" }),
  signUp: async () => ({ success: false, error: "Not implemented" }),
  signOut: () => {},
  updateUser: () => {},
  sendOtp: async () => "",
  verifyOtp: () => false,
  resetPassword: async () => false,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthContext;
}
