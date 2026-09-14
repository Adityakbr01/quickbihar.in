// src/theme/ThemeProvider.tsx
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "../colors";

export { Theme };

const ThemeContext = createContext<Theme>(darkTheme);

export const ThemeProvider = ({ children }: any) => {
  // QuickBihar is dark-first. Dark theme is the default across all platforms and SSR.
  const theme = darkTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
