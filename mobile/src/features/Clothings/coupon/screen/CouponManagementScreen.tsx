import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, ArrowLeft01Icon, Coupon02Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useRouter } from "expo-router";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "../hooks/useCoupons";
import CouponCard from "../components/CouponCard";
import CouponForm from "../components/CouponForm";
import { ICoupon } from "../types/coupon.types";

const CouponManagementScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  const [formVisible, setFormVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | undefined>();
  const [alertVisible, setAlertVisible] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: coupons, isLoading } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const handleCreate = (data: Partial<ICoupon>) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setFormVisible(false);
      },
    });
  };

  const handleUpdate = (data: Partial<ICoupon>) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, data }, {
        onSuccess: () => {
          setFormVisible(false);
          setEditingCoupon(undefined);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setAlertVisible(true);
  };

  const openEdit = (coupon: ICoupon) => {
    setEditingCoupon(coupon);
    setFormVisible(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Coupons & Offers</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => { setEditingCoupon(undefined); setFormVisible(true); }}
        >
          <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CouponCard
            coupon={item}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <HugeiconsIcon icon={Coupon02Icon} size={64} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.tertiaryText }]}>No coupons found</Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: theme.primary + "15" }]}
              onPress={() => setFormVisible(true)}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>Create Your First Coupon</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <CouponForm
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingCoupon(undefined); }}
        onSubmit={editingCoupon ? handleUpdate : handleCreate}
        initialData={editingCoupon}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <IOSAlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon code? This action cannot be undone."
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteId && deleteMutation.mutate(deleteId)
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  createFirstBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  }
});

export default CouponManagementScreen;
