import { StyleSheet } from "react-native";

const SizeChartAdminScreenStyle = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        flex: 1,
        textAlign: "center",
    },
    addButton: {
        padding: 8,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: "#fff",
        fontWeight: "700",
        marginLeft: 6,
        fontSize: 14,
    },
});

export default SizeChartAdminScreenStyle;