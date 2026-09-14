// src/theme/ThemeProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme, Theme } from "../colors";

export { Theme };

export type ThemeMode = "light" | "dark";

interface ThemeContextValue extends Theme {
  /** Active mode: "dark" or "light". Default is "dark". Manual toggle only — no system-follow. */
  mode: ThemeMode;
  isDark: boolean;
  /** False until the persisted choice is restored — gate splash-hide on this. */
  ready: boolean;
  /** Persisted manual choice from the Profile toggle. */
  setMode: (mode: ThemeMode) => void;
  /** Flip dark ↔ light. Same as setMode, for toggle buttons. */
  toggleMode: () => void;
}

const STORAGE_KEY = "quickbihar-theme-mode-v1";

// ponytail: web reads localStorage synchronously in the initializer, so a
// reload paints the saved theme on the very first frame (0ms flash).
// Native restores async in the effect below while the splash screen covers it.
function getStoredMode(): ThemeMode {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage?.getItem(STORAGE_KEY) : null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

function persistMode(next: ThemeMode) {
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  try {
    if (typeof window !== "undefined") window.localStorage?.setItem(STORAGE_KEY, next);
  } catch {}
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

export const ThemeProvider = ({ children }: any) => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [ready, setReady] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (typeof window !== "undefined") return; // already restored synchronously
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setModeState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
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
