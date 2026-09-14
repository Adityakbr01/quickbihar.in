// src/theme/ThemeProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme, Theme } from "../colors";

export { Theme };

export type ThemeMode = "light" | "dark";

interface ThemeContextValue extends Theme {
  /** Active mode: "dark" or "light". Default is "dark". Manual toggle only. */
  mode: ThemeMode;
  isDark: boolean;
  /** False until persisted choice is restored on native — gate splash-hide on this. */
  ready: boolean;
  /** Persisted manual choice from the Profile toggle. */
  setMode: (mode: ThemeMode) => void;
  /** Flip dark ↔ light. Same as setMode, for toggle buttons. */
  toggleMode: () => void;
}

const STORAGE_KEY = "quickbihar-theme-mode-v1";

// ponytail: on web, read localStorage synchronously in the initializer so a
// page reload paints the saved theme on the very first frame (0ms flash).
// On native (Android/iOS), async restoration runs in useEffect while the splash screen covers it.
function getStoredMode(): ThemeMode {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const saved = window.localStorage?.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
  }
  return "dark";
}

function persistMode(next: ThemeMode) {
  AsyncStorage.setItem(STORAGE_KEY, next).catch((err: unknown) => {
    console.warn("AsyncStorage theme write error:", err);
  });
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage?.setItem(STORAGE_KEY, next);
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }
}

const fallbackValue: ThemeContextValue = {
  ...darkTheme,
  mode: "dark",
  isDark: true,
  ready: false,
  setMode: () => {},
  toggleMode: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(fallbackValue);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [ready, setReady] = useState(() => Platform.OS === "web");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (active && (saved === "light" || saved === "dark")) {
          setModeState(saved);
        }
      })
      .catch((err: unknown) => {
        console.warn("AsyncStorage theme read error:", err);
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persistMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      persistMode(next);
      return next;
    });
  }, []);

  const isDark = mode === "dark";
  const value: ThemeContextValue = {
    ...(isDark ? darkTheme : lightTheme),
    mode,
    isDark,
    ready,
    setMode,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
