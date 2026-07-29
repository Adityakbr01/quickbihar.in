import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
}

const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
    </View>
  );
};

export default AdminHeader;

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
});
