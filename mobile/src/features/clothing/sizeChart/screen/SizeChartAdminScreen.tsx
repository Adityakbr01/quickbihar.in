import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Add01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SizeChartAdminScreenStyle from "../style/SizeChartAdminScreen.style";
import { useRouter } from "expo-router";
import {
  useCreateSizeChart,
  useDeleteSizeChart,
  useSizeCharts,
  useUpdateSizeChart,
} from "../hooks/useSizeCharts";
import { ISizeChart } from "../types/sizeChart.types";
import SizeChartList from "../components/SizeChartList";
import SizeChartForm from "../components/SizeChartForm";

const SizeChartAdminScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { data: charts, isLoading } = useSizeCharts();
  const createMutation = useCreateSizeChart();
  const updateMutation = useUpdateSizeChart();
  const deleteMutation = useDeleteSizeChart();

  const [formVisible, setFormVisible] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ISizeChart | undefined>(
    undefined,
  );
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [chartToDelete, setChartToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedChart(undefined);
    setFormVisible(true);
  };

  const handleEdit = (chart: ISizeChart) => {
    setSelectedChart(chart);
    setFormVisible(true);
  };

  const handleDelete = (id: string) => {
    setChartToDelete(id);
    setDeleteAlertVisible(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedChart) {
      updateMutation.mutate(
        { id: selectedChart._id, data },
        {
          onSuccess: () => setFormVisible(false),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormVisible(false),
      });
    }
  };

  return (
    <SafeViewWrapper>
      <View
        style={[
          SizeChartAdminScreenStyle.header,
          { borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={SizeChartAdminScreenStyle.backButton}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[SizeChartAdminScreenStyle.headerTitle, { color: theme.text }]}
        >
          Size Charts
        </Text>
        <TouchableOpacity
          style={[
            SizeChartAdminScreenStyle.addButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleCreate}
        >
          <HugeiconsIcon icon={Add01Icon} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <SizeChartList
        charts={charts || []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SizeChartForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialData={selectedChart}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <IOSAlertDialog
        visible={deleteAlertVisible}
        onClose={() => setDeleteAlertVisible(false)}
        title="Delete Size Chart"
        message="Are you sure you want to permanently delete this size chart? This action cannot be undone."
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (chartToDelete) deleteMutation.mutate(chartToDelete);
            },
          },
        ]}
      />
    </SafeViewWrapper>
  );
};

export default SizeChartAdminScreen;
