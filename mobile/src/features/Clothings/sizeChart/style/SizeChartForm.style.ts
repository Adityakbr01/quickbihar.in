import { StyleSheet } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

const createSizeChartFormStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: "90%",
      paddingVertical: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    form: {
      flex: 1,
    },
    formContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.tertiaryText,
      marginBottom: 8,
    },
    categoryScroll: {
      marginBottom: 12,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.tertiaryBackground,
      marginRight: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    categoryChipActive: {
      backgroundColor: theme.primary + "15",
      borderColor: theme.primary,
    },
    chipImage: {
      width: 24,
      height: 24,
      borderRadius: 10,
      marginRight: 6,
      backgroundColor: theme.background,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.tertiaryText,
    },
    categoryChipTextActive: {
      color: theme.primary,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 12,
      color: theme.text,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    unitBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.background,
      marginRight: 10,
    },
    unitBtnActive: {
      backgroundColor: theme.primary,
    },
    unitText: {
      color: theme.tertiaryText,
      fontWeight: "600",
    },
    unitTextActive: {
      color: "#fff",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    addBtnText: {
      marginLeft: 4,
      color: theme.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    deleteBtn: {
      marginLeft: 12,
      padding: 8,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    tableCell: {
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    tableHeaderText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.text,
      textTransform: "capitalize",
    },
    tableCellInput: {
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text,
      textAlign: "center",
      fontSize: 14,
    },
    rowDeleteBtn: {
      width: 50,
      alignItems: "center",
    },
    submitBtn: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      marginHorizontal: 20,
    },
    submitBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 8,
    },
  });

export default createSizeChartFormStyles;
