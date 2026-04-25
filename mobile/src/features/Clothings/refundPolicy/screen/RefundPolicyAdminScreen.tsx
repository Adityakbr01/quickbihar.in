import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, ArrowLeft01Icon, Delete01Icon, PencilEdit01Icon, Cancel01Icon, CheckmarkCircle01Icon, Tag01Icon, Calendar03Icon, ShippingTruck02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { 
    useAdminRefundPolicies, 
    useCreateRefundPolicy, 
    useUpdateRefundPolicy, 
    useDeleteRefundPolicy 
} from "../hooks/useRefundPolicies";
import { IRefundPolicy } from "../../product/types/product.types";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";

const RefundPolicyAdminScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { data: policies, isLoading } = useAdminRefundPolicies();
  const createMutation = useCreateRefundPolicy();
  const updateMutation = useUpdateRefundPolicy();
  const deleteMutation = useDeleteRefundPolicy();

  const [formVisible, setFormVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<IRefundPolicy | null>(null);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  // Advanced Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [returnWindowDays, setReturnWindowDays] = useState("7");
  const [refundProcessingDays, setRefundProcessingDays] = useState("5");
  const [refundType, setRefundType] = useState("Original Payment Method");
  const [returnShipping, setReturnShipping] = useState("Customer");
  const [isReturnable, setIsReturnable] = useState(true);
  const [isExchangeAvailable, setIsExchangeAvailable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [conditionInput, setConditionInput] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);

  const handleCreate = () => {
    setSelectedPolicy(null);
    setName(""); setCategory("General"); setDescription(""); setReturnWindowDays("7");
    setRefundProcessingDays("5"); setRefundType("Original Payment Method"); 
    setReturnShipping("Customer"); setIsReturnable(true); setIsExchangeAvailable(true);
    setIsActive(true); setConditions([]);
    setFormVisible(true);
  };

  const handleEdit = (policy: IRefundPolicy) => {
    setSelectedPolicy(policy);
    setName(policy.name);
    setCategory(policy.category);
    setDescription(policy.description);
    setReturnWindowDays(String(policy.returnWindowDays));
    setRefundProcessingDays(String(policy.refundProcessingDays));
    setRefundType(policy.refundType);
    setReturnShipping(policy.returnShipping);
    setIsReturnable(policy.isReturnable);
    setIsExchangeAvailable(policy.isExchangeAvailable);
    setIsActive(policy.isActive);
    setConditions(policy.conditions || []);
    setFormVisible(true);
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      setConditions([...conditions, conditionInput.trim()]);
      setConditionInput("");
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const data = { 
      name, category, description, 
      returnWindowDays: Number(returnWindowDays), 
      refundProcessingDays: Number(refundProcessingDays),
      refundType, returnShipping, isReturnable, isExchangeAvailable,
      isActive, conditions 
    };

    if (selectedPolicy) {
      updateMutation.mutate({ id: selectedPolicy._id, data }, {
        onSuccess: () => setFormVisible(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormVisible(false)
      });
    }
  };

  const renderPolicyItem = ({ item }: { item: IRefundPolicy }) => (
    <View style={[styles.policyCard, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={[styles.policyTitle, { color: theme.text }]}>{item.name}</Text>
          <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
            <Text style={{ fontSize: 10, color: theme.primary, fontWeight: "600" }}>{item.category}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={{ color: theme.tertiaryText, fontSize: 12, marginBottom: 8 }}>
          {item.description}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <HugeiconsIcon icon={Calendar03Icon} size={12} color={theme.tertiaryText} />
            <Text style={{ fontSize: 11, color: theme.tertiaryText, marginLeft: 4 }}>{item.returnWindowDays} Days Window</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <HugeiconsIcon icon={ShippingTruck02Icon} size={12} color={theme.tertiaryText} />
            <Text style={{ fontSize: 11, color: theme.tertiaryText, marginLeft: 4 }}>{item.returnShipping}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
          <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
            onPress={() => { setPolicyToDelete(item._id); setDeleteAlertVisible(true); }} 
            style={styles.actionBtn}
        >
          <HugeiconsIcon icon={Delete01Icon} size={18} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeViewWrapper>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Refund Policies</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleCreate}
        >
          <HugeiconsIcon icon={Add01Icon} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />
      ) : (
        <FlatList
          data={policies?.data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderPolicyItem}
        />
      )}

      {/* Advanced Form Modal */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedPolicy ? "Edit Pro Policy" : "New Pro Policy"}
              </Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.formSection}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <HugeiconsIcon icon={InformationCircleIcon} size={18} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Basic Info</Text>
                </View>
                
                <Text style={[styles.label, { color: theme.text }]}>Policy Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. 7-Day Easy Return"
                  placeholderTextColor={theme.tertiaryText}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                      value={category}
                      onChangeText={setCategory}
                      placeholder="e.g. Fashion"
                      placeholderTextColor={theme.tertiaryText}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                     <Text style={[styles.label, { color: theme.text }]}>Refund Type</Text>
                     <TextInput
                       style={[styles.input, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                       value={refundType}
                       onChangeText={setRefundType}
                       placeholder="e.g. Wallet"
                       placeholderTextColor={theme.tertiaryText}
                     />
                  </View>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: "top", backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this policy briefly..."
                  placeholderTextColor={theme.tertiaryText}
                  multiline
                />
              </View>

              <View style={styles.formSection}>
                 <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <HugeiconsIcon icon={Calendar03Icon} size={18} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Windows & Logic</Text>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Return Window (Days)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                      value={returnWindowDays}
                      onChangeText={setReturnWindowDays}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Processing (Days)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                      value={refundProcessingDays}
                      onChangeText={setRefundProcessingDays}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.toggleRow, { marginBottom: 16 }]}>
                  <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Is Returnable?</Text>
                  <Switch value={isReturnable} onValueChange={setIsReturnable} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>

                <View style={[styles.toggleRow, { marginBottom: 16 }]}>
                  <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Is Exchange Available?</Text>
                  <Switch value={isExchangeAvailable} onValueChange={setIsExchangeAvailable} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>
              </View>

              <View style={styles.formSection}>
                 <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <HugeiconsIcon icon={Tag01Icon} size={18} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Conditions List</Text>
                </View>
                <View style={styles.conditionInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: theme.tertiaryBackground, borderColor: theme.border, color: theme.text }]}
                    value={conditionInput}
                    onChangeText={setConditionInput}
                    placeholder="Add a condition..."
                    placeholderTextColor={theme.tertiaryText}
                  />
                  <TouchableOpacity style={[styles.addConditionBtn, { backgroundColor: theme.primary }]} onPress={addCondition}>
                    <HugeiconsIcon icon={Add01Icon} size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.conditionsList}>
                  {conditions.map((item, index) => (
                    <View key={index} style={[styles.conditionChip, { backgroundColor: theme.tertiaryBackground, borderColor: theme.border }]}>
                      <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>• {item}</Text>
                      <TouchableOpacity onPress={() => removeCondition(index)}>
                        <HugeiconsIcon icon={Cancel01Icon} size={14} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: theme.primary }]} 
              onPress={handleSubmit}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Save Pro Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <IOSAlertDialog
        visible={deleteAlertVisible}
        onClose={() => setDeleteAlertVisible(false)}
        title="Delete Policy"
        message="Are you sure you want to delete this refund policy?"
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (policyToDelete) deleteMutation.mutate(policyToDelete);
            },
          },
        ]}
      />
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "800", flex: 1, marginLeft: 15 },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  policyCard: { flexDirection: "row", padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, alignItems: "center" },
  policyTitle: { fontSize: 16, fontWeight: "700" },
  actionButtons: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "90%", paddingVertical: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  formSection: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, opacity: 0.8 },
  input: { borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1.5, fontSize: 14 },
  row: { flexDirection: "row" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  conditionInputRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  addConditionBtn: { padding: 14, borderRadius: 14, width: 50, justifyContent: "center", alignItems: "center" },
  conditionsList: { gap: 8 },
  conditionChip: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1 },
  submitBtn: { padding: 16, borderRadius: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", marginHorizontal: 20, marginBottom: 20 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 },
});

export default RefundPolicyAdminScreen;
