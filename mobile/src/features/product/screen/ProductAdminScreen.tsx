import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../hooks/useProducts";
import { IProduct } from "../types/product.types";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";

const ProductAdminScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { data: products, isLoading } = useAdminProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [formVisible, setFormVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setFormVisible(true);
  };

  const handleEdit = (product: IProduct) => {
    setSelectedProduct(product);
    setFormVisible(true);
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteAlertVisible(true);
  };

  const handleSubmit = (data: FormData | any) => {
    if (selectedProduct) {
      updateMutation.mutate(
        { id: selectedProduct._id, data },
        {
          onSuccess: () => setFormVisible(false),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormVisible(false),
      });
    }
  };

  return (
    <SafeViewWrapper>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Products</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleCreate}
        >
          <HugeiconsIcon icon={Add01Icon} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ProductList
        products={products || []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialData={selectedProduct}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <IOSAlertDialog
        visible={deleteAlertVisible}
        onClose={() => setDeleteAlertVisible(false)}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? This action cannot be undone."
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (productToDelete) deleteMutation.mutate(productToDelete);
            },
          },
        ]}
      />
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
    marginLeft: 15,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default ProductAdminScreen;
