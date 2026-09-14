// src/theme/ThemeProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme, Theme } from "../colors";

export { Theme };

export type ThemeMode = "light" | "dark";

/** Where the effective mode comes from — UI shows "Auto" only when manual. */
export type ThemeSource = "system" | "manual";

interface ThemeContextValue extends Theme {
  /** Effective mode. Default is "dark" — QuickBihar is dark-first. */
  mode: ThemeMode;
  isDark: boolean;
  source: ThemeSource;
  /** False until the persisted choice is restored — gate splash-hide on this. */
  ready: boolean;
  /** Explicit user choice — wins over the system theme, persisted. */
  setMode: (mode: ThemeMode) => void;
  /** Forget the explicit choice — follow the system theme again. */
  followSystem: () => void;
}

const STORAGE_KEY = "quickbihar-theme-mode-v1";

// ponytail: web reads localStorage synchronously in the initializer, so a
// reload paints the saved theme on the very first frame (0ms flash).
// Native restores async in the effect below while the splash screen covers it.
function getStoredMode(): ThemeMode | null {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage?.getItem(STORAGE_KEY) : null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return null;
}

function persistMode(next: ThemeMode | null) {
  if (next === null) {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  } else {
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }
  try {
    if (typeof window !== "undefined") {
      if (next === null) window.localStorage?.removeItem(STORAGE_KEY);
      else window.localStorage?.setItem(STORAGE_KEY, next);
    }
  } catch {}
}

const fallbackValue: ThemeContextValue = {
  ...darkTheme,
  mode: "dark",
  isDark: true,
  source: "system",
  ready: false,
  setMode: () => {},
  followSystem: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(fallbackValue);

export const ThemeProvider = ({ children }: any) => {
  // Explicit user choice. null = never touched the toggle → follow system.
  const [manual, setManualState] = useState<ThemeMode | null>(getStoredMode);
  const [ready, setReady] = useState(() => typeof window !== "undefined");
  // Reactive on Android, iOS and web — device flip auto-applies when manual is null.
  const systemScheme = useColorScheme();

  useEffect(() => {
    if (typeof window !== "undefined") return; // already restored synchronously
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setManualState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setManualState(next);
    persistMode(next);
  }, []);

  const followSystem = useCallback(() => {
    setManualState(null);
    persistMode(null);
  }, []);

  const mode: ThemeMode = manual ?? (systemScheme === "light" ? "light" : "dark");
  const isDark = mode === "dark";
  const value: ThemeContextValue = {
    ...(isDark ? darkTheme : lightTheme),
    mode,
    isDark,
    source: manual === null ? "system" : "manual",
    ready,
    setMode,
    followSystem,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
