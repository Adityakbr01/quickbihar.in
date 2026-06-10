import React, { useState, useMemo, FormEvent } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ManagedPerson } from "../../api/adminManagement.api";
import {
  AdminProduct,
  AdminSizeChart,
  ProductPayload,
  ProductVariantPayload,
  QueryParams,
} from "../../api/catalogManagement.api";
import {
  useAdminProducts,
  useAdminCategories,
  useCreateCatalogProduct,
  useUpdateCatalogProduct,
  useDeleteCatalogProduct,
  useAdminSellerSizeCharts,
} from "../../hooks/useCatalogManagement";
import { useAdminPolicies } from "../../hooks/useAdminManagement";
import {
  inputClass,
  selectClass,
  textareaClass,
  formatDate,
  formatAmount,
  entityId,
  optionalValue,
  splitCsv,
  numericOrUndefined,
} from "../../utils";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared/TableHelpers";
import { cn } from "@/lib/utils";

export function ProductManagementPanel({
  sellers,
}: {
  sellers: ManagedPerson[];
}) {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const productsQuery = useAdminProducts(params);
  const categoriesQuery = useAdminCategories({
    page: 1,
    limit: 100,
    sortBy: "title",
    sortOrder: "asc",
  });
  const createProduct = useCreateCatalogProduct();
  const updateProduct = useUpdateCatalogProduct();
  const deleteProduct = useDeleteCatalogProduct();
  const products = productsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const setParam = (
    key: keyof QueryParams,
    value: QueryParams[keyof QueryParams],
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Product Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ]}
        onStatus={(value) =>
          setParam("isActive", value === "all" ? undefined : value)
        }
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created" },
          { value: "price_low", label: "Price Low" },
          { value: "price_high", label: "Price High" },
          { value: "newest", label: "Newest" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => productsQuery.refetch()}
        extraAction={
          <Button
            onClick={() => {
              setEditing(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            key="create-product-dialog"
            product={null}
            sellers={sellers}
            categories={categories}
            isPending={createProduct.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload, images) => {
              createProduct.mutate(
                { payload, images },
                { onSuccess: () => setIsCreateOpen(false) },
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              key={editing._id}
              product={editing}
              sellers={sellers}
              categories={categories}
              isPending={updateProduct.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload, images) => {
                updateProduct.mutate(
                  { productId: editing._id, payload, images },
                  { onSuccess: () => setEditing(null) },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {productsQuery.isLoading && (
            <LoadingState label="Loading products..." />
          )}
          {!productsQuery.isLoading && !products.length && (
            <EmptyState label="No products found." />
          )}
          {!productsQuery.isLoading && Boolean(products.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Product</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Price</TableHead>
                  <TableHead className="text-gray-400">Stock</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {product.category}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.brand || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        Rs. {formatAmount(product.price)}
                      </div>
                      {product.originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          Rs. {formatAmount(product.originalPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {product.totalStock ??
                        product.variants?.reduce(
                          (sum, variant) => sum + Number(variant.stock || 0),
                          0,
                        )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          updateProduct.mutate({
                            productId: product._id,
                            payload: { isActive: !product.isActive },
                          })
                        }
                      >
                        <StatusBadge
                          active={Boolean(product.isActive)}
                          label={product.isActive ? "Active" : "Inactive"}
                        />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => {
                            setEditing(product);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (
                              window.confirm(`Delete product ${product.title}?`)
                            )
                              deleteProduct.mutate(product._id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PaginationFooter
        page={params.page || 1}
        totalPages={productsQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />
    </div>
  );
}

function ProductField({
  label,
  required,
  helper,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string | null;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
        {required && (
          <span className="rounded-full border border-red-400/30 px-1.5 py-0.5 text-[10px] leading-none text-red-200">
            Required
          </span>
        )}
      </span>
      {children}
      {(error || helper) && (
        <span
          className={cn(
            "text-xs leading-4",
            error ? "text-red-300" : "text-gray-500",
          )}
        >
          {error || helper}
        </span>
      )}
    </div>
  );
}

function ProductNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : tone === "warning"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : "border-sky-400/30 bg-sky-500/10 text-sky-100";

  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm", className)}>
      {children}
    </div>
  );
}

function categoryKey(value?: string) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactList(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const key = categoryKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function categoryMatchesAssignment(
  category: string,
  categoryDoc: any,
  assignedCategories: string[],
) {
  if (!assignedCategories.length) return true;
  const assignedKeys = new Set(assignedCategories.map(categoryKey));
  return [category, categoryDoc?.title, categoryDoc?.slug].some((value) =>
    assignedKeys.has(categoryKey(value)),
  );
}

function sellerName(seller: ManagedPerson) {
  const storeName = seller.sellerProfile?.store?.name;
  const profileName = seller.sellerProfile?.businessName || seller.fullName;
  return storeName && storeName !== profileName
    ? `${storeName} (${profileName})`
    : profileName;
}

function ProductForm({
  product,
  sellers,
  categories,
  onSubmit,
  onCancel,
  isPending,
}: {
  product: AdminProduct | null;
  sellers: ManagedPerson[];
  categories: any[];
  onSubmit: (payload: ProductPayload, images: File[]) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const initialSellerId = product?.sellerId || sellers[0]?._id || "";
  const initialSeller = sellers.find((seller) => seller._id === initialSellerId);
  const initialStore = initialSeller?.sellerProfile?.store;
  const [sellerId, setSellerId] = useState(initialSellerId);
  const [title, setTitle] = useState(product?.title || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [category, setCategory] = useState(product?.category || "");
  const [subCategory, setSubCategory] = useState(product?.subCategory || "");
  const [gender, setGender] = useState(product?.gender || "");
  const [description, setDescription] = useState(product?.description || "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription || "",
  );
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(
    String(product?.originalPrice ?? ""),
  );
  const [sku, setSku] = useState(product?.details?.sku || "");

  const discountPercentage = useMemo(() => {
    const sPrice = Number(price);
    const oPrice = Number(originalPrice);
    if (oPrice && sPrice && oPrice > sPrice) {
      return Math.round(((oPrice - sPrice) / oPrice) * 100);
    }
    return 0;
  }, [price, originalPrice]);

  const priceError = "";
  const [isGstApplicable, setIsGstApplicable] = useState(
    Boolean(product?.isGstApplicable),
  );
  const [gstPercentage, setGstPercentage] = useState(
    String(product?.gstPercentage ?? 0),
  );
  const [fit, setFit] = useState(product?.details?.fit || "");
  const [pattern, setPattern] = useState(product?.details?.pattern || "");
  const [material, setMaterial] = useState(product?.details?.material || "");
  const [collar, setCollar] = useState(product?.details?.collar || "");
  const [sleeve, setSleeve] = useState(product?.details?.sleeve || "");
  const [washCare, setWashCare] = useState(product?.details?.washCare || "");
  const [tags, setTags] = useState((product?.tags || []).join(", "));
  const [isFeatured, setIsFeatured] = useState(Boolean(product?.isFeatured));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(product?.seo?.metaTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    product?.seo?.metaDescription || "",
  );
  const [seoKeywords, setSeoKeywords] = useState(
    (product?.seo?.keywords || []).join(", "),
  );
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [sizeChartId, setSizeChartId] = useState(
    typeof product?.sizeChartId === "object"
      ? (product.sizeChartId as any)._id
      : product?.sizeChartId || "",
  );

  // Policy references states
  const [returnPolicyId, setReturnPolicyId] = useState(
    product?.policyRefs?.returnPolicy || ""
  );
  const [refundPolicyId, setRefundPolicyId] = useState(
    product?.policyRefs?.refundPolicy ||
      (typeof product?.refundPolicy === "object"
        ? (product.refundPolicy as any)._id
        : product?.refundPolicy || ""),
  );
  const [shippingPolicyId, setShippingPolicyId] = useState(
    product?.policyRefs?.shippingPolicy || ""
  );
  const [termsPolicyId, setTermsPolicyId] = useState(
    product?.policyRefs?.termsPolicy || ""
  );

  const [isExpressAvailable, setIsExpressAvailable] = useState(
    product?.deliveryInfo?.isExpressAvailable ?? false,
  );
  const [isCodAvailable, setIsCodAvailable] = useState(
    product?.deliveryInfo?.isCodAvailable ?? true,
  );
  const [estimatedDays, setEstimatedDays] = useState(
    String(product?.deliveryInfo?.estimatedDays ?? 3),
  );
  const [deliveryReturnPolicy, setDeliveryReturnPolicy] = useState(
    product?.deliveryInfo?.returnPolicy ||
      "",
  );
  const [manufacturerDetail, setManufacturerDetail] = useState(
    product?.compliance?.manufacturerDetail || "",
  );
  const [packerDetail, setPackerDetail] = useState(
    product?.compliance?.packerDetail || "",
  );
  const [countryOfOrigin, setCountryOfOrigin] = useState(
    product?.compliance?.countryOfOrigin || "India",
  );
  const [variants, setVariants] = useState<ProductVariantPayload[]>(
    product?.variants?.length
      ? product.variants
      : [{ size: "", color: "", price: undefined, stock: 0, sku: "" }],
  );
  const sizeChartsQuery = useAdminSellerSizeCharts(sellerId);
  const refundPoliciesQuery = useAdminPolicies({ page: 1, limit: 100, status: "true" });
  const sizeCharts = sizeChartsQuery.data || [];
  const refundPolicies = refundPoliciesQuery.data?.data || [];
  const activeCategories = useMemo(
    () => categories.filter((item) => item.isActive !== false),
    [categories],
  );
  const selectedSeller = useMemo(
    () => sellers.find((seller) => seller._id === sellerId),
    [sellerId, sellers],
  );
  const selectedStore = selectedSeller?.sellerProfile?.store;
  const parentCategories = useMemo(
    () => activeCategories.filter((cat) => !cat.parentId),
    [activeCategories]
  );
  const effectiveCategory = category || parentCategories[0]?.title || "";
  const selectedCategoryDoc = useMemo(
    () => activeCategories.find((item) => item.title === effectiveCategory || item.slug === effectiveCategory),
    [effectiveCategory, activeCategories]
  );

  const subCategories = useMemo(() => {
    if (!selectedCategoryDoc) return [];
    return activeCategories.filter((item) => {
      const pId = typeof item.parentId === "object" ? item.parentId?._id : item.parentId;
      return pId === selectedCategoryDoc._id;
    });
  }, [selectedCategoryDoc, activeCategories]);

  const selectedChart = sizeCharts.find((chart) => chart._id === sizeChartId);
  const totalImages = existingImages.length + newImages.length;
  const submitBlockReason = useMemo(() => {
    if (!product && !sellers.length) {
      return "No seller stores are available. Approve a seller before creating products.";
    }
    if (!sellerId) return "Select the seller store for this product.";
    if (selectedSeller) {
      if (!selectedStore) {
        return "Selected seller does not have a store configuration yet.";
      }
      if (selectedStore.isActive === false) {
        return "Selected seller store is inactive.";
      }
    }
    if (!effectiveCategory) return "Select a product category.";
    if (totalImages < 1) return "Add at least one product image.";
    if (totalImages > 5) return "A product can have a maximum of 5 images.";

    // Price and originalPrice checks
    const oPrice = Number(originalPrice);
    if (!oPrice) return "MRP / Original Price is required.";

    return "";
  }, [
    effectiveCategory,
    product,
    selectedSeller,
    selectedStore,
    sellerId,
    sellers.length,
    totalImages,
    price,
    originalPrice,
  ]);

  const changeSeller = (nextSellerId: string) => {
    setSellerId(nextSellerId);
    setCategory("");
    setSizeChartId("");
  };

  const chooseImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const availableSlots = Math.max(5 - totalImages, 0);
    if (selected.length > availableSlots) {
      setImageError("Maximum 5 product images are allowed.");
    } else {
      setImageError("");
    }
    setNewImages((current) => [
      ...current,
      ...selected.slice(0, availableSlots),
    ]);
    event.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setImageError("");
  };

  const removeNewImage = (index: number) => {
    setNewImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setImageError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (totalImages < 1) {
      setImageError("At least one product image is required.");
      return;
    }
    if (totalImages > 5) {
      setImageError("Maximum 5 product images are allowed.");
      return;
    }
    if (submitBlockReason) return;
    onSubmit(
      {
        sellerId: sellerId || undefined,
        title,
        brand: optionalValue(brand),
        category: effectiveCategory,
        subCategory: subCategory || undefined,
        gender: optionalValue(gender),
        description: optionalValue(description),
        shortDescription: optionalValue(shortDescription),
        price: Number(price),
        originalPrice: numericOrUndefined(originalPrice),
        sizeChartId: optionalValue(sizeChartId),
        isGstApplicable,
        gstPercentage: numericOrUndefined(gstPercentage) || 0,
        details: {
          sku: optionalValue(sku),
          fit: optionalValue(fit),
          pattern: optionalValue(pattern),
          material: optionalValue(material),
          collar: optionalValue(collar),
          sleeve: optionalValue(sleeve),
          washCare: optionalValue(washCare),
        },
        tags: splitCsv(tags),
        variants: variants.map((variant) => ({
          ...variant,
          price:
            variant.price === undefined || variant.price === null
              ? undefined
              : Number(variant.price),
          stock: Number(variant.stock || 0),
        })),
        seo: {
          metaTitle: optionalValue(seoTitle),
          metaDescription: optionalValue(seoDescription),
          keywords: splitCsv(seoKeywords),
        },
        deliveryInfo: {
          isExpressAvailable,
          isCodAvailable,
          estimatedDays: numericOrUndefined(estimatedDays) || 3,
          returnPolicy: optionalValue(deliveryReturnPolicy),
        },
        compliance: {
          manufacturerDetail: optionalValue(manufacturerDetail),
          packerDetail: optionalValue(packerDetail),
          countryOfOrigin: optionalValue(countryOfOrigin) || "India",
        },
        policyRefs: {
          returnPolicy: returnPolicyId || undefined,
          refundPolicy: refundPolicyId || undefined,
          shippingPolicy: shippingPolicyId || undefined,
          termsPolicy: termsPolicyId || undefined,
        },
        refundPolicy: refundPolicyId || undefined,
        existingImages,
        isFeatured,
        isActive,
      },
      newImages,
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      {submitBlockReason && (
        <ProductNotice tone="error">{submitBlockReason}</ProductNotice>
      )}

      <ProductFormSection
        title="Basic Info"
        helper="Required fields are marked. Category is limited to the seller store setup."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ProductField
            label="Seller Store"
            required
            helper="Admin creates this product under the selected seller store."
          >
            <select
              value={sellerId}
              onChange={(event) => changeSeller(event.target.value)}
              required={!product}
              className={selectClass}
            >
              <option value="">Select seller store</option>
              {sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {sellerName(seller)}
                </option>
              ))}
            </select>
          </ProductField>
          <ProductField label="Product Name" required>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Men's Cotton Casual Shirt"
              required
              className={inputClass}
            />
          </ProductField>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ProductField
            label="Brand"
            helper="Optional. Leave blank if the product has no separate brand."
          >
            <Input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Bihar Handloom"
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="Product Category"
            required
            helper="Select main category."
          >
            <select
              value={effectiveCategory}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubCategory("");
              }}
              required
              className={selectClass}
            >
              <option value="">Select category</option>
              {parentCategories.map((item) => (
                <option key={item._id} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
          </ProductField>
          <ProductField
            label="Product Subcategory"
            helper={subCategories.length > 0 ? "Select subcategory." : "No subcategories available."}
          >
            <select
              value={subCategory}
              onChange={(event) => setSubCategory(event.target.value)}
              className={selectClass}
              disabled={subCategories.length === 0}
            >
              <option value="">No subcategory selected</option>
              {subCategories.map((item) => (
                <option key={item._id} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
          </ProductField>
          <ProductField
            label="Gender"
            helper="Optional. Select target audience gender."
          >
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className={selectClass}
            >
              <option value="">Select Gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
              <option value="Unisex">Unisex</option>
            </select>
          </ProductField>
          <ProductField
            label="Product SKU"
            helper="Auto-generated by backend."
          >
            <Input
              value={sku}
              disabled
              placeholder="Auto-generated if blank"
              className={inputClass}
            />
          </ProductField>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ProductField
            label="Short Description"
            helper="Optional one-line summary for product cards."
          >
            <textarea
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="Premium handloom cotton casual shirt for everyday comfort."
              className={cn(textareaClass, "w-full")}
            />
          </ProductField>
          <ProductField
            label="Full Description"
            helper="Optional longer details for the product page."
          >
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Crafted from high-quality handloom cotton..."
              className={cn(textareaClass, "w-full")}
            />
          </ProductField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="Pricing & GST">
        <div className="grid gap-3 md:grid-cols-4">
          <ProductField
            label="MRP / Original Price"
            required
            helper="Original retail price before discount (MRP)."
          >
            <Input
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
              placeholder="998"
              type="number"
              min="0"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="Selling Price"
            required
            helper="Customer pays this price, for example 677."
          >
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="677"
              type="number"
              min="0"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField label="GST Percentage" helper="Optional. Use 0 if GST is not applicable.">
            <Input
              value={gstPercentage}
              onChange={(event) => setGstPercentage(event.target.value)}
              placeholder="0"
              type="number"
              min="0"
              className={inputClass}
            />
          </ProductField>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9 self-end">
            <span>GST Applicable</span>
            <Switch
              checked={isGstApplicable}
              onCheckedChange={setIsGstApplicable}
            />
          </div>
          {discountPercentage > 0 && (
            <div className="md:col-span-4 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              Calculated Discount: {discountPercentage}% OFF
            </div>
          )}
          {priceError && (
            <div className="md:col-span-4 rounded border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-300">
              {priceError}
            </div>
          )}
        </div>
      </ProductFormSection>

      <ProductFormSection
        title="Media"
        helper={`${totalImages}/5 selected. Create and edit both require at least one product image.`}
      >
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={chooseImages}
          disabled={totalImages >= 5}
          className={inputClass}
        />
        {imageError && <div className="text-xs text-red-300">{imageError}</div>}
        <div className="grid gap-2 md:grid-cols-2">
          {existingImages.map((image, index) => (
            <div
              key={`${image.fileId}-${index}`}
              className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300"
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <img
                  src={image.url}
                  alt="Product Preview"
                  className="h-10 w-10 rounded object-cover border border-white/10"
                />
                <span className="truncate">{image.url}</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-300 hover:bg-red-400/10 hover:text-red-200 shrink-0"
                onClick={() => removeExistingImage(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          {newImages.map((image, index) => {
            const previewUrl = URL.createObjectURL(image);
            return (
              <div
                key={`${image.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <img
                    src={previewUrl}
                    alt="New Preview"
                    className="h-10 w-10 rounded object-cover border border-white/10"
                  />
                  <span className="truncate">{image.name}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-300 hover:bg-red-400/10 hover:text-red-200 shrink-0"
                  onClick={() => {
                    removeNewImage(index);
                    URL.revokeObjectURL(previewUrl);
                  }}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </ProductFormSection>

      <VariantEditor variants={variants} onChange={setVariants} />

      <ProductFormSection title="Size Chart" helper="Fetched from server for the selected seller.">
        <select
          value={sizeChartId}
          onChange={(event) => setSizeChartId(event.target.value)}
          className={selectClass}
        >
          <option value="">No size chart</option>
          {sizeCharts.map((chart) => (
            <option key={chart._id} value={chart._id}>
              {chart.name} ({chart.category})
            </option>
          ))}
        </select>
        {selectedChart?.description && (
          <div className="text-xs text-blue-300/90 bg-blue-500/5 border border-blue-500/20 rounded p-2">
            {selectedChart.description}
          </div>
        )}
        {selectedChart && <SizeChartPreview chart={selectedChart} />}
      </ProductFormSection>

      <ProductFormSection
        title="Policies"
        helper="Select admin-approved policies for return, refund, shipping, and terms."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ProductField label="Return Policy" required>
            <select
              value={returnPolicyId}
              onChange={(event) => setReturnPolicyId(event.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select Return Policy</option>
              {refundPolicies
                .filter((p) => p.policyType === "RETURN")
                .map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.name}
                  </option>
                ))}
            </select>
          </ProductField>

          <ProductField label="Refund Policy" required>
            <select
              value={refundPolicyId}
              onChange={(event) => setRefundPolicyId(event.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select Refund Policy</option>
              {refundPolicies
                .filter((p) => p.policyType === "REFUND")
                .map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.name}
                  </option>
                ))}
            </select>
          </ProductField>

          <ProductField label="Shipping Policy" required>
            <select
              value={shippingPolicyId}
              onChange={(event) => setShippingPolicyId(event.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select Shipping Policy</option>
              {refundPolicies
                .filter((p) => p.policyType === "SHIPPING")
                .map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.name}
                  </option>
                ))}
            </select>
          </ProductField>

          <ProductField label="Terms Policy" required>
            <select
              value={termsPolicyId}
              onChange={(event) => setTermsPolicyId(event.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select Terms Policy</option>
              {refundPolicies
                .filter((p) => p.policyType === "TERMS")
                .map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.name}
                  </option>
                ))}
            </select>
          </ProductField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="Delivery & Compliance">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
            <span>Express Delivery</span>
            <Switch
              checked={isExpressAvailable}
              onCheckedChange={setIsExpressAvailable}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
            <span>COD Available</span>
            <Switch
              checked={isCodAvailable}
              onCheckedChange={setIsCodAvailable}
            />
          </div>
          <ProductField label="Estimated Delivery Days" required>
            <Input
              value={estimatedDays}
              onChange={(event) => setEstimatedDays(event.target.value)}
              type="number"
              min="1"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Delivery Return Statement" helper="Optional product-page delivery return text.">
            <Input
              value={deliveryReturnPolicy}
              onChange={(event) => setDeliveryReturnPolicy(event.target.value)}
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Country of Origin" required>
            <Input
              value={countryOfOrigin}
              onChange={(event) => setCountryOfOrigin(event.target.value)}
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Manufacturer Detail" helper="Optional compliance detail.">
            <Input
              value={manufacturerDetail}
              onChange={(event) => setManufacturerDetail(event.target.value)}
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Packer Detail" helper="Optional compliance detail.">
            <Input
              value={packerDetail}
              onChange={(event) => setPackerDetail(event.target.value)}
              className={inputClass}
            />
          </ProductField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="Specifications">
        <div className="grid gap-3 md:grid-cols-3">
          <ProductField label="Fit" helper="Optional clothing attribute.">
            <Input value={fit} onChange={(event) => setFit(event.target.value)} className={inputClass} />
          </ProductField>
          <ProductField label="Pattern" helper="Optional clothing attribute.">
            <Input value={pattern} onChange={(event) => setPattern(event.target.value)} className={inputClass} />
          </ProductField>
          <ProductField label="Material" helper="Optional clothing attribute.">
            <Input value={material} onChange={(event) => setMaterial(event.target.value)} className={inputClass} />
          </ProductField>
          <ProductField label="Collar" helper="Optional clothing attribute.">
            <Input value={collar} onChange={(event) => setCollar(event.target.value)} className={inputClass} />
          </ProductField>
          <ProductField label="Sleeve" helper="Optional clothing attribute.">
            <Input value={sleeve} onChange={(event) => setSleeve(event.target.value)} className={inputClass} />
          </ProductField>
          <ProductField label="Wash Care" helper="Optional clothing attribute.">
            <Input value={washCare} onChange={(event) => setWashCare(event.target.value)} className={inputClass} />
          </ProductField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="Tags & SEO">
        <div className="grid gap-3 md:grid-cols-3">
          <ProductField
            label="Tags"
            helper="Optional comma separated values for search and filters."
          >
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="shirts, cotton, handloom"
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="SEO Meta Title"
            helper="Optional. Leave blank if SEO is not managed manually."
          >
            <Input
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Men's Cotton Casual Shirt"
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="SEO Keywords"
            helper="Optional comma separated SEO keywords."
          >
            <Input
              value={seoKeywords}
              onChange={(event) => setSeoKeywords(event.target.value)}
              placeholder="cotton shirt, handloom shirt"
              className={inputClass}
            />
          </ProductField>
        </div>
        <ProductField
          label="SEO Meta Description"
          helper="Optional short search-result description."
        >
          <textarea
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            placeholder="Comfortable handloom cotton shirt for everyday wear."
            className={cn(textareaClass, "w-full")}
          />
        </ProductField>
      </ProductFormSection>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
          <span className="mr-2">Featured Product</span>
          <Switch
            checked={isFeatured}
            onCheckedChange={setIsFeatured}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
          <span className="mr-2">Active</span>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || Boolean(submitBlockReason)}>
          <Save className="h-4 w-4" />
          {product ? "Save Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ProductFormSection({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        {helper && <div className="text-xs text-gray-500">{helper}</div>}
      </div>
      {children}
    </section>
  );
}

function SizeChartPreview({
  chart,
}: {
  chart: AdminSizeChart;
}) {
  const fields =
    chart.fields?.length ? chart.fields : Object.keys(chart.data?.[0] || {});
  const rows = (chart.data || []).slice(0, 5);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-3 py-2 text-xs text-gray-400">
        {chart.name} - {chart.category} - {chart.unit}
      </div>
      {rows.length > 0 && fields.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-gray-400">
              <tr>
                {fields.map((field) => (
                  <th key={field} className="px-3 py-2 font-medium">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-white/10 text-gray-300">
                  {fields.map((field) => (
                    <td key={field} className="px-3 py-2">
                      {String(row[field] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-3 py-2 text-xs text-gray-500">
          No preview rows available.
        </div>
      )}
    </div>
  );
}

function VariantEditor({
  variants,
  onChange,
}: {
  variants: ProductVariantPayload[];
  onChange: (variants: ProductVariantPayload[]) => void;
}) {
  const update = (
    index: number,
    key: keyof ProductVariantPayload,
    value: string,
  ) => {
    onChange(
      variants.map((variant, currentIndex) => {
        if (currentIndex !== index) return variant;
        const nextValue =
          key === "price"
            ? value === ""
              ? undefined
              : Number(value)
            : key === "stock"
              ? Number(value)
              : value;
        return { ...variant, [key]: nextValue };
      }),
    );
  };

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Product Variants</div>
          <div className="text-xs text-gray-500">
            Size, color, and stock are required. Variant SKU is auto-generated
            if blank.
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={() =>
            onChange([...variants, { size: "", color: "", stock: 0, sku: "" }])
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Add Variant
        </Button>
      </div>
      {variants.map((variant, index) => (
        <div
          key={index}
          className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
        >
          <ProductField label="Size" required>
            <Input
              value={variant.size}
              onChange={(event) => update(index, "size", event.target.value)}
              placeholder="M"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Color" required>
            <Input
              value={variant.color}
              onChange={(event) => update(index, "color", event.target.value)}
              placeholder="White"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="Variant Price (optional)"
            helper="Blank uses selling price."
          >
            <Input
              value={variant.price ?? ""}
              onChange={(event) => update(index, "price", event.target.value)}
              placeholder="899"
              type="number"
              min="0"
              className={inputClass}
            />
          </ProductField>
          <ProductField label="Stock" required>
            <Input
              value={variant.stock}
              onChange={(event) => update(index, "stock", event.target.value)}
              placeholder="0"
              type="number"
              min="0"
              required
              className={inputClass}
            />
          </ProductField>
          <ProductField
            label="Variant SKU"
            helper="Auto-generated by backend."
          >
            <Input
              value={variant.sku || ""}
              disabled
              placeholder="Auto-generated"
              className={inputClass}
            />
          </ProductField>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-red-300 hover:bg-red-400/10 hover:text-red-200"
              onClick={() =>
                onChange(
                  variants.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              disabled={variants.length === 1}
              aria-label="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
