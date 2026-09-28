import { StyleSheet } from "react-native";
import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme/Provider/ThemeProvider";

const SafeViewWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {children}
    </View>
  );
};

export default SafeViewWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
