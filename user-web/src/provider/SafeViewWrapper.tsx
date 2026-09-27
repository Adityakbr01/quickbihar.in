import { StyleSheet } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/Provider/ThemeProvider";

const SafeViewWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeViewWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
