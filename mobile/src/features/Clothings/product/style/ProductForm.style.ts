import { StyleSheet } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

const createProductFormStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      height: "92%",
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
    section: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
      opacity: 0.8,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 14,
      padding: 14,
      color: theme.text,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      fontSize: 15,
    },
    inputError: {
      borderColor: theme.error,
    },
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: -12,
      marginBottom: 12,
      marginLeft: 4,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    // Image Picker
    imageScroll: {
      flexDirection: "row",
      marginBottom: 16,
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 10,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    removeImageBtn: {
      position: "absolute",
      right: -5,
      top: -5,
      backgroundColor: theme.error,
      borderRadius: 10,
      padding: 2,
    },
    addImageBtn: {
      width: 80,
      height: 80,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    // Variants
    variantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 12,
    },
    variantInput: {
      flex: 1,
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 8,
      padding: 8,
      fontSize: 12,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    // Category chips (reuse)
    categoryScroll: {
      marginBottom: 12,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.background,
      marginRight: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    chipImage: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 8,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    categoryChipTextActive: {
      color: "#fff",
    },
    // Table Styles
    tableContainer: {
      marginTop: 10,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableHeaderCell: {
      backgroundColor: theme.tertiaryBackground,
      padding: 10,
      width: 90,
      alignItems: "center",
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    tableHeaderText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.tertiaryText,
      textTransform: "uppercase",
    },
    tableCell: {
      padding: 10,
      width: 90,
      alignItems: "center",
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    tableCellText: {
      fontSize: 12,
      color: theme.text,
      fontWeight: "600",
    },
    // Submit
    submitBtn: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
      marginHorizontal: 20,
    },
    submitBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 8,
    },
  });

export default createProductFormStyles;
