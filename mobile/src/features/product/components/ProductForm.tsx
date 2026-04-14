import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useCategories } from "@/src/features/category/hooks/useCategories";
import { useSizeCharts } from "@/src/features/sizeChart/hooks/useSizeCharts";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createProductFormStyles from "../style/ProductForm.style";
import { IProduct, IVariant } from "../types/product.types";
import { productSchema } from "../validation/product.schema";

// Sub-components
import ProductBasicInfo from "./form/ProductBasicInfo";
import ProductCategorySelector from "./form/ProductCategorySelector";
import ProductDeliveryInfo from "./form/ProductDeliveryInfo";
import ProductMedia from "./form/ProductMedia";
import ProductPricing from "./form/ProductPricing";
import ProductSizeChartSelector from "./form/ProductSizeChartSelector";
import ProductSpecifications from "./form/ProductSpecifications";
import ProductVariants from "./form/ProductVariants";

interface ProductFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData | any) => void;
  initialData?: IProduct;
  loading?: boolean;
}

const ProductForm = ({ visible, onClose, onSubmit, initialData, loading }: ProductFormProps) => {
  const theme = useTheme();
  const styles = createProductFormStyles(theme);
  const { data: categories } = useCategories();
  const { data: sizeCharts } = useSizeCharts();

  // State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [variants, setVariants] = useState<IVariant[]>([{ size: "", color: "", stock: 0, sku: "" }]);
  const [sizeChartId, setSizeChartId] = useState("");
  const [tags, setTags] = useState("");
  const [fit, setFit] = useState("");
  const [pattern, setPattern] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [washCare, setWashCare] = useState("");
  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState("3");

  const [errors, setErrors] = useState<any>({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ title: "", message: "", onConfirm: () => { } });

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setBrand(initialData.brand);
        setCategory(initialData.category);
        setPrice(String(initialData.price));
        setOriginalPrice(String(initialData.originalPrice || ""));
        setDiscountPercentage(String(initialData.discountPercentage || ""));
        setImages(initialData.images.map(img => ({ url: img.url, fileId: img.fileId })));
        setVariants(initialData.variants);
        setSizeChartId(initialData.sizeChartId || "");
        setTags(initialData.tags.join(", "));
        setFit(initialData.details?.fit || "");
        setPattern(initialData.details?.pattern || "");
        setSleeve(initialData.details?.sleeve || "");
        setWashCare(initialData.details?.washCare || "");
        setIsExpressAvailable(initialData.deliveryInfo?.isExpressAvailable || false);
        setEstimatedDays(String(initialData.deliveryInfo?.estimatedDays || "3"));
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setBrand(""); setCategory(""); setPrice(""); setOriginalPrice(""); setDiscountPercentage("");
    setImages([]); setVariants([{ size: "", color: "", stock: 0, sku: "" }]);
    setSizeChartId(""); setTags(""); setFit(""); setPattern(""); setSleeve(""); setWashCare("");
    setIsExpressAvailable(false); setEstimatedDays("3");
  };

  const pickImage = async () => {
    if (images.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 1,
    });
    if (!result.canceled) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        type: "image/jpeg",
        name: asset.fileName || `product_${Date.now()}.jpg`,
      }));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const addVariant = () => setVariants([...variants, { size: "", color: "", stock: 0, sku: "" }]);
  const removeVariant = (index: number) => variants.length > 1 && setVariants(variants.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: keyof IVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const validate = () => {
    const dataToValidate = {
      title, description, brand, category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      variants,
      images,
      sizeChartId,
      details: { fit, pattern, sleeve, washCare },
      deliveryInfo: { isExpressAvailable, estimatedDays: Number(estimatedDays) },
    };

    const result = productSchema.safeParse(dataToValidate);
    if (!result.success) {
      const formattedErrors: any = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join(".");
        formattedErrors[path] = issue.message;

        // Handle nested variants errors
        if (issue.path[0] === "variants") {
          const index = issue.path[1];
          if (!formattedErrors.variants) formattedErrors.variants = {};
          if (!formattedErrors.variants[index]) formattedErrors.variants[index] = {};
          formattedErrors.variants[index][issue.path[2]] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("originalPrice", originalPrice);
    formData.append("sizeChartId", sizeChartId);
    formData.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(t => t !== "")));
    formData.append("variants", JSON.stringify(variants));
    formData.append("details", JSON.stringify({ fit, pattern, sleeve, washCare }));
    formData.append("deliveryInfo", JSON.stringify({ isExpressAvailable, estimatedDays: Number(estimatedDays) }));

    images.forEach((img, index) => {
      if (img.uri) formData.append("images", img as any);
      else formData.append(`existingImages[${index}]`, JSON.stringify(img));
    });

    if (initialData) {
      const hasNewImages = images.some(img => img.uri);
      if (!hasNewImages) {
        onSubmit({
          title, description, brand, category, price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          sizeChartId, tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""), variants,
          details: { fit, pattern, sleeve, washCare },
          deliveryInfo: { isExpressAvailable, estimatedDays: Number(estimatedDays) }
        });
      } else {
        onSubmit(formData);
      }
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{initialData ? "Edit Product" : "New Product"}</Text>
            <TouchableOpacity onPress={onClose}><HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            <ProductBasicInfo {...{ theme, styles, title, setTitle, description, setDescription, brand, setBrand, tags, setTags, errors }} />
            <ProductPricing {...{ theme, styles, price, setPrice, originalPrice, setOriginalPrice, discountPercentage, setDiscountPercentage, errors }} />
            <ProductMedia {...{ theme, styles, images, pickImage, removeImage, errors }} />
            <ProductCategorySelector {...{ theme, styles, categories, category, setCategory, errors }} />
            <ProductSizeChartSelector {...{ theme, styles, sizeCharts, sizeChartId, setSizeChartId }} />
            <ProductSpecifications {...{ theme, styles, fit, setFit, pattern, setPattern, sleeve, setSleeve, washCare, setWashCare }} />
            <ProductDeliveryInfo {...{ theme, styles, isExpressAvailable, setIsExpressAvailable, estimatedDays, setEstimatedDays, errors }} />
            <ProductVariants {...{ theme, styles, variants, addVariant, updateVariant, removeVariant, errors }} />
          </ScrollView>

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <><HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" /><Text style={styles.submitBtnText}>{initialData ? "Update Chart" : "Save Product"}</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <IOSAlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertConfig.title} message={alertConfig.message} buttons={[{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: alertConfig.onConfirm }]} />
    </Modal>
  );
};

export default ProductForm;
