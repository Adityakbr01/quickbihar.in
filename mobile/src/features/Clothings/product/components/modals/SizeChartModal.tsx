import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChart } from "../../types/product.types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SizeChartModalProps {
  visible: boolean;
  onClose: () => void;
  sizeChart: ISizeChart | null;
  theme: Theme;
}

const SizeChartModal = ({ visible, onClose, sizeChart, theme }: SizeChartModalProps) => {
  if (!sizeChart) return null;

  const { fields, data, name, unit, howToMeasure } = sizeChart;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[s.title, { color: theme.text }]}>{name}</Text>
              <Text style={[s.subtitle, { color: theme.secondaryText }]}>
                Measurements in {unit}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            {/* Table */}
            <View style={[s.tableContainer, { borderColor: theme.border }]}>
              {/* Table Header */}
              <View style={[s.row, s.headerRow, { backgroundColor: theme.tertiaryBackground }]}>
                <View style={[s.cell, s.firstCell]}>
                  <Text style={[s.headerCellText, { color: theme.text }]}>SIZE</Text>
                </View>
                {fields.map((field) => (
                  <View key={field} style={s.cell}>
                    <Text style={[s.headerCellText, { color: theme.text }]}>
                      {field.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Table Rows */}
              {data.map((row, index) => (
                <View
                  key={index}
                  style={[
                    s.row,
                    { borderTopColor: theme.border },
                    index % 2 === 1 && { backgroundColor: theme.secondaryBackground },
                  ]}
                >
                  <View style={[s.cell, s.firstCell]}>
                    <Text style={[s.sizeText, { color: theme.primary, fontWeight: "800" }]}>
                      {row.size}
                    </Text>
                  </View>
                  {fields.map((field) => (
                    <View key={field} style={s.cell}>
                      <Text style={[s.cellText, { color: theme.secondaryText }]}>
                        {row[field] || "-"}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* How to Measure */}
            {howToMeasure && howToMeasure.length > 0 && (
              <View style={s.measureSection}>
                <Text style={[s.sectionTitle, { color: theme.text }]}>How to Measure</Text>
                {howToMeasure.map((step, i) => (
                  <View key={i} style={s.stepRow}>
                    <View style={[s.stepDot, { backgroundColor: theme.primary }]} />
                    <Text style={[s.stepText, { color: theme.secondaryText }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    marginTop: 20
  },
  container: {
    height: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  firstCell: {
    flex: 0.8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,0,0,0.1)",
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sizeText: {
    fontSize: 14,
  },
  cellText: {
    fontSize: 13,
    fontWeight: "600",
  },
  measureSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 12,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
});

export default SizeChartModal;
