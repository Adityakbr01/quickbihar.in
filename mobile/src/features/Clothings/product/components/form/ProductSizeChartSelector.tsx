import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import ProductSizeChartPreview from "./ProductSizeChartPreview";

interface ProductSizeChartSelectorProps {
  theme: Theme;
  styles: any;
  sizeCharts: any[] | undefined;
  sizeChartId: string;
  setSizeChartId: (v: string) => void;
}

const ProductSizeChartSelector = ({
  theme,
  styles,
  sizeCharts,
  sizeChartId,
  setSizeChartId,
}: ProductSizeChartSelectorProps) => {
  const selectedChart = sizeCharts?.find(c => c._id === sizeChartId);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Size Chart</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {sizeCharts?.map((chart) => (
          <TouchableOpacity
            key={chart._id}
            style={[styles.categoryChip, sizeChartId === chart._id && styles.categoryChipActive]}
            onPress={() => setSizeChartId(chart._id)}
          >
            <Text style={[styles.categoryChipText, sizeChartId === chart._id && styles.categoryChipTextActive]}>
              {chart.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedChart && (
        <>
          <Text style={[styles.label, { marginTop: 12, marginBottom: 4 }]}>Preview: {selectedChart.name}</Text>
          <ProductSizeChartPreview theme={theme} styles={styles} chart={selectedChart} />
        </>
      )}
    </View>
  );
};

export default ProductSizeChartSelector;
