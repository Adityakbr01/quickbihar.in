// src/theme/ThemeProvider.tsx
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "../colors";

export { Theme };

const ThemeContext = createContext(lightTheme);

export const ThemeProvider = ({ children }: any) => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
