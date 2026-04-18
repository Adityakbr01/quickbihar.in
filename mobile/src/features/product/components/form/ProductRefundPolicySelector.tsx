import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { useAdminRefundPolicies } from "@/src/features/refundPolicy/hooks/useRefundPolicies";

interface ProductRefundPolicySelectorProps {
  theme: Theme;
  styles: any;
  refundPolicyId: string;
  setRefundPolicyId: (v: string) => void;
}

const ProductRefundPolicySelector = ({
  theme,
  styles,
  refundPolicyId,
  setRefundPolicyId,
}: ProductRefundPolicySelectorProps) => {
  const { data: policies, isLoading } = useAdminRefundPolicies();

  if (isLoading) {
    return <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 10 }} />;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Refund Policy</Text>
      <Text style={[styles.label, { marginBottom: 12 }]}>Select a policy for this product</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
      >
        {policies?.data?.map((policy) => (
          <TouchableOpacity
            key={policy._id}
            style={[
              styles.categoryChip,
              refundPolicyId === policy._id && styles.categoryChipActive,
            ]}
            onPress={() => setRefundPolicyId(policy._id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                refundPolicyId === policy._id && styles.categoryChipTextActive,
              ]}
            >
              {policy.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {refundPolicyId && policies?.data?.find(p => p._id === refundPolicyId) && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: theme.background, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
          <Text style={{ fontSize: 13, color: theme.text, fontWeight: "600", marginBottom: 4 }}>
            {policies?.data?.find(p => p._id === refundPolicyId)?.name} ({policies?.data?.find(p => p._id === refundPolicyId)?.returnWindowDays} Days)
          </Text>
          <Text style={{ fontSize: 12, color: theme.tertiaryText, lineHeight: 18 }}>
            {policies?.data?.find(p => p._id === refundPolicyId)?.description}
          </Text>
          <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
             {policies?.data?.find(p => p._id === refundPolicyId)?.conditions.map((c, i) => (
                 <View key={i} style={{ backgroundColor: theme.tertiaryBackground, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                     <Text style={{ fontSize: 10, color: theme.text }}>• {c}</Text>
                 </View>
             ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default ProductRefundPolicySelector;
