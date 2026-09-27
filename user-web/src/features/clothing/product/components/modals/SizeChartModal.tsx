import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChart } from "../../types/product.types";
import * as Haptics from "expo-haptics";
import {
  Sheet,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";
import { spacing } from "@/src/theme/spacing";

interface SizeChartModalProps {
  visible: boolean;
  onClose: () => void;
  sizeChart?: ISizeChart | null;
  selectedSize?: string | null;
  category?: string;
  theme: Theme;
}

const DEFAULT_CHART: ISizeChart = {
  _id: "default-apparel-chart",
  name: "Standard Clothing Size Guide",
  category: "Clothing",
  unit: "inches",
  fields: ["chest", "length", "shoulder", "waist"],
  data: [
    { size: "XS", chest: "36", length: "26", shoulder: "16.5", waist: "30" },
    { size: "S", chest: "38", length: "27", shoulder: "17.0", waist: "32" },
    { size: "M", chest: "40", length: "28", shoulder: "17.5", waist: "34" },
    { size: "L", chest: "42", length: "29", shoulder: "18.5", waist: "36" },
    { size: "XL", chest: "44", length: "30", shoulder: "19.5", waist: "38" },
    { size: "XXL", chest: "46", length: "31", shoulder: "20.5", waist: "40" },
    { size: "3XL", chest: "48", length: "32", shoulder: "21.5", waist: "42" },
  ],
  howToMeasure: [
    "Chest: Measure around the fullest part of your chest, keeping the measuring tape horizontal.",
    "Length: Measure from the highest point of the shoulder down to the bottom hemline.",
    "Shoulder: Measure across the back from one shoulder edge to the other.",
    "Waist: Measure around your natural waistline, where you typically wear your waistband.",
  ],
};

const SizeChartModal = ({
  visible,
  onClose,
  sizeChart,
  selectedSize,
  category,
  theme,
}: SizeChartModalProps) => {
  const sheet = useSheet();
  const [activeUnit, setActiveUnit] = useState<"inches" | "cm">("inches");

  const effectiveChart =
    sizeChart && sizeChart.data && sizeChart.data.length > 0
      ? sizeChart
      : DEFAULT_CHART;

  const { fields, data, name, howToMeasure } = effectiveChart;

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  const handleUnitToggle = (unit: "inches" | "cm") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveUnit(unit);
  };

  // Convert value if unit is CM and original was inches
  const formatCellValue = (val: string | number | undefined) => {
    if (!val || val === "-") return "-";
    const num = parseFloat(String(val));
    if (isNaN(num)) return String(val);

    if (activeUnit === "cm") {
      return (num * 2.54).toFixed(1);
    }
    return String(num);
  };

  return (
    <Sheet ref={sheet} onDidDismiss={onClose} backgroundColor={theme.background}>
      <SheetHeader
        title={name || "Size & Fit Guide"}
        subtitle={`Find your perfect fit (${category || "Apparel"})`}
        onClose={onClose}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* Unit Toggle Buttons */}
        <View
          style={[
            s.unitToggleRow,
            {
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              s.unitBtn,
              activeUnit === "inches" && [
                s.unitBtnActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => handleUnitToggle("inches")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                s.unitBtnText,
                {
                  color: activeUnit === "inches" ? "#fff" : theme.secondaryText,
                },
              ]}
            >
              INCHES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.unitBtn,
              activeUnit === "cm" && [
                s.unitBtnActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => handleUnitToggle("cm")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                s.unitBtnText,
                {
                  color: activeUnit === "cm" ? "#fff" : theme.secondaryText,
                },
              ]}
            >
              CM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Container */}
        <View style={[s.tableContainer, { borderColor: theme.border }]}>
          {/* Table Header */}
          <View
            style={[
              s.row,
              s.headerRow,
              { backgroundColor: theme.tertiaryBackground },
            ]}
          >
            <View style={[s.cell, s.firstCell]}>
              <Text style={[s.headerCellText, { color: theme.text }]}>
                SIZE
              </Text>
            </View>
            {fields.map((field) => (
              <View key={field} style={s.cell}>
                <Text style={[s.headerCellText, { color: theme.text }]}>
                  {String(field || "").toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {data.map((row, index) => {
            const rowSizeStr = String(
              row?.size ??
                row?.Size ??
                row?.["Size (UK)"] ??
                row?.["Size (Age)"] ??
                Object.values(row || {})[0] ??
                "",
            );
            const isSelected = Boolean(
              selectedSize &&
                rowSizeStr &&
                rowSizeStr.toUpperCase() ===
                  String(selectedSize).toUpperCase(),
            );
            return (
              <View
                key={index}
                style={[
                  s.row,
                  { borderTopColor: theme.border },
                  isSelected
                    ? { backgroundColor: theme.primary + "1A" }
                    : index % 2 === 1
                      ? { backgroundColor: theme.tertiaryBackground + "40" }
                      : undefined,
                ]}
              >
                <View style={[s.cell, s.firstCell]}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text
                      style={[
                        s.sizeText,
                        {
                          color: isSelected ? theme.primary : theme.text,
                          fontWeight: isSelected ? "800" : "700",
                        },
                      ]}
                    >
                      {rowSizeStr || "-"}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={13}
                        color={theme.primary}
                      />
                    )}
                  </View>
                </View>
                {fields.map((field) => (
                  <View key={field} style={s.cell}>
                    <Text
                      style={[
                        s.cellText,
                        {
                          color: isSelected
                            ? theme.primary
                            : theme.secondaryText,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {formatCellValue(row[field])}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* How to Measure Section */}
        {howToMeasure && howToMeasure.length > 0 && (
          <View
            style={[
              s.measureSection,
              {
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={s.measureTitleRow}>
              <Ionicons name="body-outline" size={18} color={theme.primary} />
              <Text style={[s.sectionTitle, { color: theme.text }]}>
                How to Measure Correctly
              </Text>
            </View>
            {howToMeasure.map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View
                  style={[s.stepDot, { backgroundColor: theme.primary }]}
                />
                <Text style={[s.stepText, { color: theme.secondaryText }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Sheet>
  );
};

const s = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  unitToggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  unitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitBtnActive: {
    elevation: 1,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    paddingVertical: 12,
    borderTopWidth: 0,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  firstCell: {
    flex: 0.9,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,0,0,0.1)",
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sizeText: {
    fontSize: 13,
  },
  cellText: {
    fontSize: 13,
  },
  measureSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  measureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 10,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

export default SizeChartModal;
