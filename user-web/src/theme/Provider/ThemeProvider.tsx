import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { lightTheme, darkTheme, type Theme } from "../colors";
import { useModuleStore } from "@/store/useModuleStore";
import type { ModuleId } from "@/constants/modules";

export type { Theme };

export type ThemeMode = "light" | "dark";

export interface ThemeContextValue extends Theme {
  mode: ThemeMode;
  isDark: boolean;
  activeModule: ModuleId;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setModule: (module: ModuleId) => void;
}

const STORAGE_KEY = "quickbihar-theme-mode-v1";

function getStoredMode(): ThemeMode {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage?.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch {}
  }
  return "dark"; // Default is dark matching mobile
}

function persistMode(next: ThemeMode) {
  if (typeof window !== "undefined") {
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
  activeModule: "clothing",
  setMode: () => {},
  toggleMode: () => {},
  setModule: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(fallbackValue);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const currentModuleId = useModuleStore((s) => s.currentModuleId);
  const setStoreModule = useModuleStore((s) => s.setModule);

  const isDark = mode === "dark";

  // Synchronize DOM attributes for both Tailwind dark mode and module color palette
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-module", currentModuleId);
  }, [isDark, currentModuleId]);

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

  const value: ThemeContextValue = {
    ...(isDark ? darkTheme : lightTheme),
    mode,
    isDark,
    activeModule: currentModuleId,
    setMode,
    toggleMode,
    setModule: setStoreModule,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
