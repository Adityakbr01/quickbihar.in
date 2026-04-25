import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";

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
// import ProductPricing from "./form/ProductPricing";
import ProductSizeChartSelector from "./form/ProductSizeChartSelector";
import ProductSpecifications from "./form/ProductSpecifications";
import ProductVariants from "./form/ProductVariants";
import ProductCompliance from "./form/ProductCompliance";
import ProductLogistics from "./form/ProductLogistics";
import ProductRefundPolicySelector from "./form/ProductRefundPolicySelector";
import ProductPricing from "./form/ProductPricing";
import { useCategories } from "../../category/hooks/useCategories";
import { useSizeCharts } from "../../sizeChart/hooks/useSizeCharts";

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
  const [isGstApplicable, setIsGstApplicable] = useState(false);
  const [gstPercentage, setGstPercentage] = useState("0");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [variants, setVariants] = useState<IVariant[]>([{ size: "", color: "", stock: 0, sku: "" }]);
  const [sizeChartId, setSizeChartId] = useState("");
  const [tags, setTags] = useState("");
  const [fit, setFit] = useState("");
  const [pattern, setPattern] = useState("");
  const [material, setMaterial] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [washCare, setWashCare] = useState("");
  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [isCodAvailable, setIsCodAvailable] = useState(true);
  const [estimatedDays, setEstimatedDays] = useState("3");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [manufacturerDetail, setManufacturerDetail] = useState("");
  const [packerDetail, setPackerDetail] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [pickupLocation, setPickupLocation] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [refundPolicyId, setRefundPolicyId] = useState("");

  const [errors, setErrors] = useState<any>({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ title: "", message: "", onConfirm: () => { } });

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setBrand(initialData.brand || "");
        setCategory(initialData.category);
        setPrice(String(initialData.price));
        setIsGstApplicable(initialData.isGstApplicable ?? false);
        setGstPercentage(String(initialData.gstPercentage ?? "0"));
        setOriginalPrice(String(initialData.originalPrice || ""));
        setDiscountPercentage(String(initialData.discountPercentage || ""));
        setImages(initialData.images.map(img => ({ url: img.url, fileId: img.fileId })));
        setVariants(initialData.variants);
        setSizeChartId(initialData.sizeChartId || "");
        setTags(initialData.tags.join(", "));
        setFit(initialData.details?.fit || "");
        setPattern(initialData.details?.pattern || "");
        setMaterial(initialData.details?.material || "");
        setSleeve(initialData.details?.sleeve || "");
        setWashCare(initialData.details?.washCare || "");
        setIsExpressAvailable(initialData.deliveryInfo?.isExpressAvailable || false);
        setIsCodAvailable(initialData.deliveryInfo?.isCodAvailable ?? true);
        setEstimatedDays(String(initialData.deliveryInfo?.estimatedDays || "3"));
        setReturnPolicy(initialData.deliveryInfo?.returnPolicy || "");
        setManufacturerDetail(initialData.compliance?.manufacturerDetail || "");
        setPackerDetail(initialData.compliance?.packerDetail || "");
        setCountryOfOrigin(initialData.compliance?.countryOfOrigin || "India");
        setPickupLocation(initialData.logistics?.pickupLocation || "");
        setWarehouseName(initialData.logistics?.warehouseName || "");
        setLatitude(initialData.logistics?.latitude);
        setLongitude(initialData.logistics?.longitude);
        setRefundPolicyId(typeof initialData.refundPolicy === 'string' ? initialData.refundPolicy : initialData.refundPolicy?._id || "");
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setBrand(""); setCategory(""); setPrice("");
    setIsGstApplicable(false); setGstPercentage("0");
    setOriginalPrice(""); setDiscountPercentage("");
    setImages([]); setVariants([{ size: "", color: "", stock: 0, sku: "" }]);
    setSizeChartId(""); setTags(""); setFit(""); setPattern(""); setMaterial(""); setSleeve(""); setWashCare("");
    setIsExpressAvailable(false); setIsCodAvailable(true); setEstimatedDays("3"); setReturnPolicy("");
    setManufacturerDetail(""); setPackerDetail(""); setCountryOfOrigin("India");
    setPickupLocation(""); setWarehouseName(""); setLatitude(undefined); setLongitude(undefined);
    setRefundPolicyId("");
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
      isGstApplicable,
      gstPercentage: Number(gstPercentage),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      variants,
      images,
      sizeChartId,
      details: { fit, pattern, material, sleeve, washCare },
      deliveryInfo: {
        isExpressAvailable,
        isCodAvailable,
        estimatedDays: Number(estimatedDays),
        returnPolicy: returnPolicy || undefined
      },
      compliance: {
        manufacturerDetail: manufacturerDetail || undefined,
        packerDetail: packerDetail || undefined,
        countryOfOrigin
      },
      logistics: {
        pickupLocation: pickupLocation || undefined,
        warehouseName: warehouseName || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      },
      refundPolicy: refundPolicyId || undefined,
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
    formData.append("isGstApplicable", String(isGstApplicable));
    formData.append("gstPercentage", gstPercentage);
    formData.append("originalPrice", originalPrice);
    formData.append("sizeChartId", sizeChartId);
    formData.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(t => t !== "")));
    formData.append("variants", JSON.stringify(variants));
    formData.append("details", JSON.stringify({ fit, pattern, material, sleeve, washCare }));
    formData.append("deliveryInfo", JSON.stringify({
      isExpressAvailable,
      isCodAvailable,
      estimatedDays: Number(estimatedDays),
      returnPolicy
    }));
    formData.append("compliance", JSON.stringify({
      manufacturerDetail,
      packerDetail,
      countryOfOrigin
    }));
    formData.append("logistics", JSON.stringify({
      pickupLocation,
      warehouseName,
      latitude,
      longitude
    }));
    if (refundPolicyId) formData.append("refundPolicy", refundPolicyId);

    images.forEach((img, index) => {
      if (img.uri) formData.append("images", img as any);
      else formData.append(`existingImages[${index}]`, JSON.stringify(img));
    });

    if (initialData) {
      const hasNewImages = images.some(img => img.uri);
      if (!hasNewImages) {
        onSubmit({
          title, description, brand, category, price: Number(price),
          isGstApplicable,
          gstPercentage: Number(gstPercentage),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          sizeChartId, tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""), variants,
          details: { fit, pattern, material, sleeve, washCare },
          deliveryInfo: {
            isExpressAvailable,
            isCodAvailable,
            estimatedDays: Number(estimatedDays),
            returnPolicy
          },
          compliance: {
            manufacturerDetail,
            packerDetail,
            countryOfOrigin
          },
          logistics: {
            pickupLocation,
            warehouseName,
            latitude,
            longitude
          },
          refundPolicy: refundPolicyId
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

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <ProductBasicInfo {...{ theme, styles, title, setTitle, description, setDescription, brand, setBrand, tags, setTags, errors }} />
            <ProductPricing {...{ theme, styles, price, setPrice, originalPrice, setOriginalPrice, isGstApplicable, setIsGstApplicable, gstPercentage, setGstPercentage, errors }} />
            <ProductMedia {...{ theme, styles, images, pickImage, removeImage, errors }} />
            <ProductCategorySelector {...{ theme, styles, categories, category, setCategory, errors }} />
            <ProductSizeChartSelector {...{ theme, styles, sizeCharts, sizeChartId, setSizeChartId }} />
            <ProductRefundPolicySelector {...{ theme, styles, refundPolicyId, setRefundPolicyId }} />
            <ProductSpecifications {...{ theme, styles, fit, setFit, pattern, setPattern, material, setMaterial, sleeve, setSleeve, washCare, setWashCare }} />
            <ProductDeliveryInfo {...{ theme, styles, isExpressAvailable, setIsExpressAvailable, isCodAvailable, setIsCodAvailable, estimatedDays, setEstimatedDays, returnPolicy, setReturnPolicy, errors }} />
            <ProductCompliance {...{ theme, styles, manufacturerDetail, setManufacturerDetail, packerDetail, setPackerDetail, countryOfOrigin, setCountryOfOrigin }} />
            <ProductLogistics {...{ theme, styles, pickupLocation, setPickupLocation, warehouseName, setWarehouseName, latitude, setLatitude, longitude, setLongitude }} />
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
