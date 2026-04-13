import { StyleSheet, Platform } from "react-native";

export const createBannerStyles = (theme: any) => StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 20,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
            },
            android: {
                // elevation: 4,
            },
        }),
    },
    cardImage: {
        width: "100%",
        height: 220,
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        padding: 16,
        justifyContent: "space-between",
    },
    cardOverlayGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "transparent",
    },
    cardBadgeContainer: {
        flexDirection: "row",
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    badgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
    activeBadge: {
        backgroundColor: "#34C759", // iOS Green
    },
    inactiveBadge: {
        backgroundColor: "#FF3B30", // iOS Red
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 14,
        marginTop: 6,
        opacity: 0.8,
        lineHeight: 20,
    },
    cardStatsRow: {
        flexDirection: "row",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        gap: 24,
    },
    statItem: {
        flexDirection: "column",
    },
    statLabel: {
        fontSize: 10,
        fontWeight: "700",
        opacity: 0.4,
        textTransform: "uppercase",
        marginBottom: 4,
        letterSpacing: 0.5,
        color: theme.text
    },
    statValue: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.text
    },

    // Modal & Form Styles
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 12,
        maxHeight: "90%",
    },
    modalIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: theme.border,
        alignSelf: "center",
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 50,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: theme.tertiaryBackground,
        borderWidth: 1,
        borderColor: theme.border,
    },
    textArea: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: "top",
    },
    // Image Picker Styles
    imagePickerContainer: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 24,
        backgroundColor: theme.tertiaryBackground,
        borderWidth: 2,
        borderColor: theme.border,
        borderStyle: "dashed",
        overflow: "hidden",
        marginBottom: 20,
    },
    imagePickerButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    lottieContainer: {
        width: 100,
        height: 100,
    },
    imagePickerText: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 8,
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    removeImageBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginVertical: 12,
    },
    flex1: {
        flex: 1,
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: theme.tertiaryBackground,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.text,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    // Screen Styles
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        flex: 1,
        marginLeft: 12,
        letterSpacing: -0.5,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: "100%",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    center: {
        marginTop: 100,
        alignItems: "center",
    },
    emptyState: {
        alignItems: "center",
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        marginBottom: 12,
    },
    emptyButton: {
        padding: 10,
    },
    // Category Selector Styles
    categorySelectContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    categorySelectItem: {
        alignItems: "center",
        width: 80,
        marginRight: 12,
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "transparent",
    },
    selectedCategoryItem: {
        backgroundColor: theme.primary + "15", // 15% opacity primary
        borderColor: theme.primary,
    },
    categorySelectImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: "hidden",
        marginBottom: 6,
        borderWidth: 1,
        borderColor: theme.border,
    },
    categorySelectImage: {
        width: "100%",
        height: "100%",
    },
    categorySelectText: {
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
    },
    selectedCategoryText: {
        color: theme.primary,
        fontWeight: "700",
    }
});
