import { StyleSheet, Dimensions } from "react-native";
import { Theme } from "@/src/theme/colors";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

export const createWishlistStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    itemCount: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.secondaryText,
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    card: {
      width: COLUMN_WIDTH,
      marginBottom: 20,
      borderRadius: 12,
      backgroundColor: theme.background,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    image: {
      width: "100%",
      height: COLUMN_WIDTH * 1.3,
      backgroundColor: theme.secondaryBackground,
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    info: {
      padding: 10,
    },
    brand: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    title: {
      fontSize: 12,
      color: theme.secondaryText,
      marginBottom: 6,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    price: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
    },
    originalPrice: {
      fontSize: 11,
      color: theme.secondaryText,
      textDecorationLine: "line-through",
    },
    discount: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      gap: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },
    shopBtn: {
      marginTop: 10,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    shopBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }
  });
