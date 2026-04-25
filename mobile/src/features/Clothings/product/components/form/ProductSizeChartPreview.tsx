import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductSizeChartPreviewProps {
  theme: Theme;
  styles: any;
  chart: any;
}

const ProductSizeChartPreview = ({ theme, styles, chart }: ProductSizeChartPreviewProps) => {
  if (!chart || !chart.fields || !chart.data) return null;

  return (
    <View style={styles.tableContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.tableRow}>
            {chart.fields.map((field: string, i: number) => (
              <View key={i} style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>{field}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {chart.data.map((row: any, rowIndex: number) => (
            <View key={rowIndex} style={[styles.tableRow, rowIndex === chart.data.length - 1 && { borderBottomWidth: 0 }]}>
              {chart.fields.map((field: string, cellIndex: number) => (
                <View key={cellIndex} style={styles.tableCell}>
                  <Text style={styles.tableCellText}>
                    {row[field] || row[field.toLowerCase()] || "-"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductSizeChartPreview;
