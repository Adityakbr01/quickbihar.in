// src/theme/colors.ts
export type Theme = typeof lightTheme;

export const lightTheme = {
  background: "#ffffff",
  text: "#000000",
  secondaryBackground: "#f9f9f9",
  tertiaryBackground: "#f5f5f7",
  border: "#e5e5e7",
  secondaryText: "#86868b",
  tertiaryText: "#a1a1a6",
  primary: "#80c314ff",
  primaryLight: "#80c314ff",
  primaryDark: "#80c314ff",
  success: "#34c759",
  iconColor: "#78bf06ff",
  warning: "#ff9500",
  error: "#ff3b30",
  shadow: "rgba(0, 0, 0, 0.1)",
  spgradient: ["#020617", "#082640", "#1f648e", "#e0edf5", "#ffffff"] as const,
};

export const darkTheme = {
  background: "#0f0f0f",
  text: "#ffffff",
  secondaryBackground: "#1c1c1e",
  tertiaryBackground: "#2c2c2e",
  border: "#424245",
  secondaryText: "#8e8e93",
  tertiaryText: "#636366",
  primary: "#80c314ff",
  primaryLight: "#80c314ff",
  primaryDark: "#80c314ff",
  success: "#30b849",
  iconColor: "#80c314ff",
  warning: "#ff9504",
  error: "#ff453a",
  shadow: "rgba(0, 0, 0, 0.4)",
  spgradient: ["#020617", "#082640", "#1f648e", "#e0edf5", "#ffffff"] as const,
};
