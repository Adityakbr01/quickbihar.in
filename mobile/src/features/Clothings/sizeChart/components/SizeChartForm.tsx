import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Image } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChart, ISizeChartRow, SizeChartUnit } from "../types/sizeChart.types";
import createSizeChartFormStyles from "../style/SizeChartForm.style";
import SizeChartFieldList from "./form/SizeChartFieldList";
import SizeChartDataTable from "./form/SizeChartDataTable";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useCategories } from "../../category/hooks/useCategories";

interface SizeChartFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: ISizeChart;
  loading?: boolean;
}

const SizeChartForm = ({ visible, onClose, onSubmit, initialData, loading }: SizeChartFormProps) => {
  const theme = useTheme();
  const styles = createSizeChartFormStyles(theme);
  const { data: categoryList } = useCategories();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState<SizeChartUnit>("inches");
  const [fields, setFields] = useState<string[]>(["size", "chest", "length"]);
  const [data, setData] = useState<ISizeChartRow[]>([{ size: "S" }]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ title: "", message: "", onConfirm: () => { } });

  useEffect(() => {
    if (visible) {
      console.log("[SizeChartForm] Opening form with data:", initialData?.name);

      const chartName = initialData?.name || "";
      const chartCategory = initialData?.category || "";
      const chartUnit = initialData?.unit || "inches";
      const chartFields = initialData?.fields || ["size", "chest", "length"];
      const chartData = initialData?.data || [{ size: "S" }];

      // Normalization: Ensure rows have data for the fields even if there's a case mismatch
      const normalizedData = chartData.map((row, idx) => {
        const newRow = { ...row };
        chartFields.forEach(field => {
          if (!newRow[field] && field.toLowerCase() === "size" && newRow.size) {
            newRow[field] = newRow.size;
            console.debug(`[SizeChartForm] Normalized row ${idx}: Mapped 'size' to '${field}'`);
          }
        });
        return newRow;
      });

      setName(chartName);
      setCategory(chartCategory);
      setUnit(chartUnit);
      setFields(chartFields);
      setData(normalizedData);
    }
  }, [visible, initialData]);

  const addField = () => {
    const newFieldName = "";
    setFields([...fields, newFieldName]);
    setData(data.map(row => ({ ...row, [newFieldName]: "" })));
  };

  const removeField = (index: number) => {
    setAlertConfig({
      title: "Remove Field",
      message: `Are you sure you want to remove the field "${fields[index]}"? This will delete the data for this column in all rows.`,
      onConfirm: () => {
        const fieldToRemove = fields[index];
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);

        setData(data.map(row => {
          const newRow = { ...row };
          delete newRow[fieldToRemove];
          return newRow;
        }));
      }
    });
    setAlertVisible(true);
  };

  const updateFieldName = (index: number, newName: string) => {
    const oldName = fields[index];
    const newFields = [...fields];
    newFields[index] = newName;
    setFields(newFields);

    setData(data.map(row => {
      const newRow = { ...row };
      const value = newRow[oldName];
      delete newRow[oldName];
      newRow[newName] = value;

      if (newName.toLowerCase() === "size") {
        newRow.size = String(value || "");
      }

      return newRow;
    }));
  };

  const addRow = () => {
    const newRow: ISizeChartRow = { size: "" };
    fields.forEach((f) => {
      if (f) newRow[f] = "";
    });
    setData([...data, newRow]);
  };

  const removeRow = (index: number) => {
    setAlertConfig({
      title: "Remove Row",
      message: "Are you sure you want to remove this size row?",
      onConfirm: () => {
        const newData = [...data];
        newData.splice(index, 1);
        setData(newData);
      }
    });
    setAlertVisible(true);
  };

  const updateCell = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    const updatedRow = { ...newData[rowIndex], [field]: value };

    if (field.toLowerCase() === "size") {
      updatedRow.size = value;
    }

    newData[rowIndex] = updatedRow;
    setData(newData);
  };

  const handleSubmit = () => {
    const cleanFields = fields.filter((f) => f.trim() !== "");
    const cleanData = data.map(row => {
      const cleanRow: any = { size: row.size || "" };
      cleanFields.forEach(f => {
        cleanRow[f] = row[f] || "";
      });
      return cleanRow;
    });

    console.log("[SizeChartForm] Submitting data:", { name, cleanFields, rowCount: cleanData.length });

    onSubmit({
      name,
      category,
      unit,
      fields: cleanFields,
      data: cleanData,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{initialData ? "Edit Size Chart" : "New Size Chart"}</Text>
            <TouchableOpacity onPress={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Men T-Shirt"
              placeholderTextColor={theme.tertiaryText}
            />

            <Text style={styles.label}>Category</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {(categoryList || []).map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.categoryChip,
                    category === cat.title && styles.categoryChipActive
                  ]}
                  onPress={() => setCategory(cat.title)}
                >
                  <Image source={{ uri: cat.image }} style={styles.chipImage} />
                  <Text style={[
                    styles.categoryChipText,
                    category === cat.title && styles.categoryChipTextActive
                  ]}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., T-Shirts"
              placeholderTextColor={theme.tertiaryText}
            />

            <View style={styles.row}>
              <Text style={styles.label}>Unit: </Text>
              <TouchableOpacity
                style={[styles.unitBtn, unit === "inches" && styles.unitBtnActive]}
                onPress={() => setUnit("inches")}
              >
                <Text style={[styles.unitText, unit === "inches" && styles.unitTextActive]}>Inches</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, unit === "cm" && styles.unitBtnActive]}
                onPress={() => setUnit("cm")}
              >
                <Text style={[styles.unitText, unit === "cm" && styles.unitTextActive]}>CM</Text>
              </TouchableOpacity>
            </View>

            <SizeChartFieldList
              fields={fields}
              onAddField={addField}
              onRemoveField={removeField}
              onUpdateFieldName={updateFieldName}
              styles={styles}
              theme={theme}
            />

            <SizeChartDataTable
              fields={fields}
              data={data}
              onAddRow={addRow}
              onRemoveRow={removeRow}
              onUpdateCell={updateCell}
              styles={styles}
              theme={theme}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" />
            <Text style={styles.submitBtnText}>{initialData ? "Update Chart" : "Save Chart"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <IOSAlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: alertConfig.onConfirm,
          },
        ]}
      />
    </Modal>
  );
};

export default SizeChartForm;
