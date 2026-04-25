import React, { useState, useEffect } from "react";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Switch, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon, CheckmarkCircle01Icon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ICoupon, DiscountType } from "../types/coupon.types";
import createProductFormStyles from "../../product/style/ProductForm.style";

interface CouponFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ICoupon>) => void;
  initialData?: ICoupon;
  loading?: boolean;
}

const CouponForm = ({ visible, onClose, onSubmit, initialData, loading }: CouponFormProps) => {
  const theme = useTheme();
  const styles = createProductFormStyles(theme);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setCode(initialData.code);
      setDescription(initialData.description);
      setDiscountType(initialData.discountType);
      setDiscountValue(String(initialData.discountValue));
      setMinOrderValue(String(initialData.minOrderValue));
      setMaxDiscountAmount(String(initialData.maxDiscountAmount || ""));
      setEndDate(initialData.endDate.split("T")[0]);
      setUsageLimit(String(initialData.usageLimit));
      setUsageLimitPerUser(String(initialData.usageLimitPerUser));
      setIsActive(initialData.isActive);
      const initialDate = new Date(initialData.endDate);
      setDate(isNaN(initialDate.getTime()) ? new Date() : initialDate);
    } else if (visible) {
      resetForm();
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setCode(""); setDescription(""); setDiscountType(DiscountType.PERCENTAGE);
    setDiscountValue(""); setMinOrderValue(""); setMaxDiscountAmount("");
    setEndDate(""); setUsageLimit("100"); setUsageLimitPerUser("1"); setIsActive(true);
  };

  const handleHandleSubmit = () => {
    if (!endDate) {
      setAlertVisible(true);
      return;
    }
    onSubmit({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      endDate: new Date(endDate).toISOString(),
      usageLimit: Number(usageLimit),
      usageLimitPerUser: Number(usageLimitPerUser),
      isActive,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{initialData ? "Edit Coupon" : "New Coupon"}</Text>
            <TouchableOpacity onPress={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              <Text style={styles.label}>Coupon Code</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="SAVE50"
                placeholderTextColor={theme.tertiaryText}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Get 50% off on all items"
                placeholderTextColor={theme.tertiaryText}
                multiline
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Discount Details</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: discountType === DiscountType.PERCENTAGE ? theme.primary + "15" : "transparent" }]}
                  onPress={() => setDiscountType(DiscountType.PERCENTAGE)}
                >
                  <Text style={{ color: discountType === DiscountType.PERCENTAGE ? theme.primary : theme.text, textAlign: "center", fontWeight: "600" }}>Percentage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, { flex: 1, backgroundColor: discountType === DiscountType.FIXED ? theme.primary + "15" : "transparent" }]}
                  onPress={() => setDiscountType(DiscountType.FIXED)}
                >
                  <Text style={{ color: discountType === DiscountType.FIXED ? theme.primary : theme.text, textAlign: "center", fontWeight: "600" }}>Fixed Amount</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{discountType === DiscountType.PERCENTAGE ? "Discount (%)" : "Amount (INR)"}</Text>
                  <TextInput
                    style={styles.input}
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    placeholder="10"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Min Order (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={minOrderValue}
                    onChangeText={setMinOrderValue}
                    keyboardType="numeric"
                    placeholder="499"
                  />
                </View>
              </View>

              {discountType === DiscountType.PERCENTAGE && (
                <View>
                  <Text style={styles.label}>Max Discount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={maxDiscountAmount}
                    onChangeText={setMaxDiscountAmount}
                    keyboardType="numeric"
                    placeholder="200"
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Limits & Validity</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Total Usage Limit</Text>
                  <TextInput
                    style={styles.input}
                    value={usageLimit}
                    onChangeText={setUsageLimit}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Limit Per User</Text>
                  <TextInput
                    style={styles.input}
                    value={usageLimitPerUser}
                    onChangeText={setUsageLimitPerUser}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: endDate ? theme.text : theme.tertiaryText }}>
                  {endDate || "Select Date"}
                </Text>
                <HugeiconsIcon icon={Calendar01Icon} size={20} color={theme.tertiaryText} />
              </TouchableOpacity>

              {showDatePicker && (
                <View style={{ marginTop: 10 }}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                        setEndDate(selectedDate.toISOString().split("T")[0]);
                      }
                    }}
                    minimumDate={new Date()}
                    accentColor={theme.primary}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={{ alignSelf: "flex-end", padding: 8 }}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={[styles.row, { alignItems: "center", marginTop: 12 }]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>Is Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={"#fff"}
                />
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={handleHandleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" />
                <Text style={styles.submitBtnText}>{initialData ? "Update Coupon" : "Create Coupon"}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <IOSAlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title="Expiry Date Required"
        message="Please select an expiry date for your coupon before saving."
        buttons={[{ text: "OK", style: "default" }]}
      />
    </Modal>
  );
};

export default CouponForm;
