// CLOTHING-SPECIFIC — see multi-vertical milestone (docs/WIRE-FLOW-AUDIT-TODO.md)

import React, { type FormEvent, type ReactNode, useEffect, useState, useMemo } from "react";
import { Plus, Edit, Send, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  SellerProduct,
  SellerProductPayload,
  SellerQueryParams,
  SellerSizeChart,
  SellerPolicy,
  ProductVariantPayload,
  SellerStoreResponse,
  SellerMarketplaceConfig,
} from "@/features/seller/api/sellerManagement.api";
import {
  useSellerProducts,
  useSellerCategories,
  useSellerStore,
  useSellerAppConfig,
  useSellerSizeCharts,
  useSellerPolicies,
  useSellerProductMutations,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  RowActions,
  DeleteButton,
  PaginationBar,
  inputClass,
  selectClass,
  labelClass,
  formatAmount,
  text,
  numberValue,
  list,
  files,
  Field,
} from "./SellerHelpers";
import { CatalogVerticalTabs } from "@/features/catalog/components/CatalogVerticalTabs";
import {
  FOOD_TYPES,
  JEWELERY_PURITIES,
  toCatalogVertical,
  type CatalogVertical,
} from "@/features/catalog/lib/catalogVerticals";

type SellerCategoryOption = { _id: string; title: string; slug?: string; isActive?: boolean };

export function SellerProductsPanel({
  initialApprovalStatus,
}: {
  initialApprovalStatus?: SellerQueryParams["approvalStatus"];
}) {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const confirm = useConfirm();
  const productsQuery = useSellerProducts(params);
  const categoriesQuery = useSellerCategories();
  const storeQuery = useSellerStore();
  const appConfigQuery = useSellerAppConfig();
  const sizeChartsQuery = useSellerSizeCharts({ page: 1, limit: 100, approvalStatus: "APPROVED" });
  const refundPoliciesQuery = useSellerPolicies();
  const mutations = useSellerProductMutations();

  const assignedCategoryOptions = sellerAssignedCategoryOptions(categoriesQuery.data);
  const productCreateBlocked = categoriesQuery.isLoading ? false : !assignedCategoryOptions.length;

  useEffect(() => {
    if (!initialApprovalStatus) {
      setParams((current) =>
        current.approvalStatus ? { ...current, approvalStatus: undefined, page: 1 } : current,
      );
      return;
    }
    setParams((current) =>
      current.approvalStatus === initialApprovalStatus
        ? current
        : { ...current, approvalStatus: initialApprovalStatus, page: 1 },
    );
  }, [initialApprovalStatus]);

  return (
    <ModuleCard
      title="Products"
      actions={
        <ProductDialog
          categories={assignedCategoryOptions}
          store={storeQuery.data?.store}
          appConfig={appConfigQuery.data}
          sizeCharts={sizeChartsQuery.data?.data || []}
          refundPolicies={refundPoliciesQuery.data || []}
          trigger={
            <Button disabled={productCreateBlocked}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          }
          isPending={mutations.create.isPending}
          onSubmit={(payload, images, onSuccess) =>
            mutations.create.mutate({ payload, images }, { onSuccess })
          }
        />
      }
      filters={<ListFilters params={params} onChange={setParams} approval verticalFilter />}
    >
      {productCreateBlocked && (
        <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Product creation is available after categories are loaded.
        </div>
      )}
      <SimpleTable
        empty={productsQuery.isLoading ? "Loading products..." : "No products found."}
        columns={["Product", "Category", "Price", "Stock", "Approval", "Actions"]}
        rows={(productsQuery.data?.data || []).map((product) => [
          <div key={`${product._id}-title`} className="min-w-48">
            <div className="font-medium text-foreground">{product.title}</div>
            <div className="text-xs text-muted-foreground">
              {product.brand || product.details?.sku || product.slug}
            </div>
          </div>,
          [product.category, product.subCategory].filter(Boolean).join(" / "),
          `Rs. ${formatAmount(product.price)}`,
          product.totalStock ?? 0,
          <StatusBadge key={`${product._id}-status`} label={product.approvalStatus || "APPROVED"} />,
          <RowActions key={`${product._id}-actions`}>
            <ProductDialog
              product={product}
              categories={assignedCategoryOptions}
              store={storeQuery.data?.store}
              appConfig={appConfigQuery.data}
              sizeCharts={sizeChartsQuery.data?.data || []}
              refundPolicies={refundPoliciesQuery.data || []}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border bg-muted text-foreground hover:bg-muted"
                >
                  Edit
                </Button>
              }
              isPending={mutations.update.isPending}
              onSubmit={(payload, images, onSuccess) =>
                mutations.update.mutate({ productId: product._id, payload, images }, { onSuccess })
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-400/20"
              onClick={async () => {
                const ok = await confirm({
                  title: `Send product ${product.title} for review?`,
                  description: "The admin reviews it before it goes live in your store.",
                  confirmLabel: "Send for Review",
                  tone: "primary",
                });
                if (ok) mutations.submit.mutate(product._id);
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <DeleteButton label={`product ${product.title}`} onDelete={() => mutations.remove.mutate(product._id)} />
          </RowActions>,
        ])}
      />
      <PaginationBar result={productsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function ProductDialog({
  product,
  categories,
  store,
  appConfig,
  sizeCharts,
  refundPolicies,
  trigger,
  isPending = false,
  onSubmit,
}: {
  product?: SellerProduct;
  categories: SellerCategoryOption[];
  store?: SellerStoreResponse["store"];
  appConfig?: SellerMarketplaceConfig;
  sizeCharts: SellerSizeChart[];
  refundPolicies: SellerPolicy[];
  trigger: ReactNode;
  isPending?: boolean;
  onSubmit: (payload: SellerProductPayload, images: File[], onSuccess: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [variants, setVariants] = useState<ProductVariantPayload[]>(
    product?.variants?.length ? product.variants : [{ size: "", color: "", stock: 0, sku: "" }]
  );
  const [sizeChartId, setSizeChartId] = useState(entityId(product?.sizeChartId));
  const [sellingPrice, setSellingPrice] = useState<number | "">(product?.price ?? "");
  const [originalPrice, setOriginalPrice] = useState<number | "">(product?.originalPrice ?? "");

  const discountPercentage = useMemo(() => {
    const sPrice = Number(sellingPrice);
    const oPrice = Number(originalPrice);
    if (oPrice && sPrice && oPrice > sPrice) {
      return Math.round(((oPrice - sPrice) / oPrice) * 100);
    }
    return 0;
  }, [sellingPrice, originalPrice]);

  const commissionPercent = Number(appConfig?.marketplace?.commissionPercent ?? 15);
  const sellingPriceNumber = Number(sellingPrice || 0);
  const estimatedCommission = useMemo(
    () => Math.round(((sellingPriceNumber * commissionPercent) / 100) * 100) / 100,
    [sellingPriceNumber, commissionPercent],
  );
  const estimatedSellerNet = Math.max(0, Math.round((sellingPriceNumber - estimatedCommission) * 100) / 100);
  const payoutRules = appConfig?.delivery?.riderPayoutRules || {};
  const bonusRules = appConfig?.delivery?.bonusRules || {};

  const priceError = "";

  const [returnPolicyId, setReturnPolicyId] = useState(
    product?.policyRefs?.returnPolicy || store?.policyRefs?.returnPolicy || ""
  );
  const [refundPolicyId, setRefundPolicyId] = useState(
    product?.policyRefs?.refundPolicy || entityId(product?.refundPolicy) || store?.policyRefs?.refundPolicy || ""
  );
  const [shippingPolicyId, setShippingPolicyId] = useState(
    product?.policyRefs?.shippingPolicy || store?.policyRefs?.shippingPolicy || ""
  );
  const [termsPolicyId, setTermsPolicyId] = useState(
    product?.policyRefs?.termsPolicy || store?.policyRefs?.termsPolicy || ""
  );

  const [isExpressAvailable, setIsExpressAvailable] = useState(
    product?.deliveryInfo?.isExpressAvailable ?? false
  );
  const [isCodAvailable, setIsCodAvailable] = useState(
    product?.deliveryInfo?.isCodAvailable ?? true
  );

  const categoryOptions = categories;
  const initialCategory =
    product?.category &&
    categories.some((category) => categoryKey(category.title) === categoryKey(product.category))
      ? product.category
      : categoryOptions[0]?.title || "";

  const [category, setCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState(product?.subCategory || "");
  const [gender, setGender] = useState(product?.gender || "");
  const [vertical, setVertical] = useState<CatalogVertical>(
    toCatalogVertical((product as any)?.vertical),
  );
  const categoryBlocked = !categoryOptions.length;

  const categoriesQuery = useSellerCategories();
  const subCategories = useMemo(() => {
    if (!category || !categoriesQuery.data?.available) return [];
    const catDoc = categoriesQuery.data.available.find(
      (item: any) => categoryKey(item.title) === categoryKey(category) || categoryKey(item.slug) === categoryKey(category)
    );
    if (!catDoc) return [];
    return categoriesQuery.data.available.filter((item: any) => {
      const pId = typeof item.parentId === "object" ? item.parentId?._id : item.parentId;
      return pId === catDoc._id;
    });
  }, [category, categoriesQuery.data]);

  const selectedChart = sizeCharts.find((chart) => chart._id === sizeChartId);

  const allowedCategoryTitles = (nextVertical: CatalogVertical): Set<string> | null => {
    const available: any[] = categoriesQuery.data?.available ?? [];
    if (!available.length) return null;
    const allowed = new Set<string>();
    for (const item of available) {
      if (!item?.vertical || item.vertical === "GLOBAL" || item.vertical === nextVertical) {
        allowed.add(categoryKey(item.title));
      }
    }
    return allowed;
  };

  const visibleCategoryOptions = useMemo(() => {
    const allowed = allowedCategoryTitles(vertical);
    if (!allowed) return categoryOptions;
    const visible = categoryOptions.filter((c) => allowed.has(categoryKey(c.title)));
    return visible.length ? visible : categoryOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptions, categoriesQuery.data, vertical]);

  const changeVertical = (next: CatalogVertical) => {
    if (product) return; // locked on edit
    setVertical(next);
    const allowed = allowedCategoryTitles(next);
    if (allowed && !allowed.has(categoryKey(category))) {
      const first = categoryOptions.find((c) => allowed.has(categoryKey(c.title)));
      setCategory(first?.title || "");
      setSubCategory("");
    }
  };

  const resetDraft = () => {
    setCategory(product?.category || categoryOptions[0]?.title || "");
    setSubCategory(product?.subCategory || "");
    setGender(product?.gender || "");
    setVertical(toCatalogVertical((product as any)?.vertical));
    setExistingImages(product?.images || []);
    setNewImages([]);
    setImageError("");
    setVariants(
      product?.variants?.length ? product.variants : [{ size: "", color: "", stock: 0, sku: "" }]
    );
    setSizeChartId(entityId(product?.sizeChartId));
    setReturnPolicyId(product?.policyRefs?.returnPolicy || store?.policyRefs?.returnPolicy || "");
    setRefundPolicyId(product?.policyRefs?.refundPolicy || entityId(product?.refundPolicy) || store?.policyRefs?.refundPolicy || "");
    setShippingPolicyId(product?.policyRefs?.shippingPolicy || store?.policyRefs?.shippingPolicy || "");
    setTermsPolicyId(product?.policyRefs?.termsPolicy || store?.policyRefs?.termsPolicy || "");
    setIsExpressAvailable(product?.deliveryInfo?.isExpressAvailable ?? false);
    setIsCodAvailable(product?.deliveryInfo?.isCodAvailable ?? true);
    setSellingPrice(product?.price ?? "");
    setOriginalPrice(product?.originalPrice ?? "");
  };

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) resetDraft();
  };

  const totalImages = existingImages.length + newImages.length;

  const chooseImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const availableSlots = Math.max(5 - totalImages, 0);
    if (selected.length > availableSlots) {
      setImageError("Maximum 5 product images are allowed.");
    } else {
      setImageError("");
    }
    setNewImages((current) => [...current, ...selected.slice(0, availableSlots)]);
    event.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setImageError("");
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setImageError("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (categoryBlocked) return;
    if (totalImages < 1) {
      setImageError("At least one product image is required.");
      return;
    }
    if (totalImages > 5) {
      setImageError("Maximum 5 product images are allowed.");
      return;
    }
    const sPrice = Number(sellingPrice);
    const oPrice = Number(originalPrice);
    if (!oPrice) {
      alert("MRP / Original Price is required.");
      return;
    }
    const form = new FormData(event.currentTarget);
    if (vertical === "JEWELERY") {
      const metal = text(form, "jeweleryMetalType");
      const pur = text(form, "jeweleryPurity");
      const wt = numberValue(form, "jeweleryWeightGrams");
      if (!metal || !pur || !wt || wt <= 0) {
        alert("Metal type, purity and weight are required for jewelry.");
        return;
      }
    }
    onSubmit(
      {
        title: text(form, "title"),
        brand: text(form, "brand") || undefined,
        category: category,
        subCategory: subCategory || undefined,
        gender: gender || undefined,
        vertical,
        jeweleryDetails:
          vertical === "JEWELERY"
            ? {
                metalType: text(form, "jeweleryMetalType") || undefined,
                purity: text(form, "jeweleryPurity") || undefined,
                hallmark: form.get("jeweleryHallmark") === "on",
                bisMark: text(form, "jeweleryBisMark") || undefined,
                gemstone: text(form, "jeweleryGemstone") || undefined,
                stoneWeightCt: numberValue(form, "jeweleryStoneWeightCt"),
                weightGrams: numberValue(form, "jeweleryWeightGrams"),
                makingCharge: numberValue(form, "jeweleryMakingCharge"),
                wastagePct: numberValue(form, "jeweleryWastagePct"),
                certNo: text(form, "jeweleryCertNo") || undefined,
                certUrl: text(form, "jeweleryCertUrl") || undefined,
              }
            : undefined,
        foodDetails:
          vertical === "FOOD"
            ? {
                vegNonVeg: text(form, "foodVegNonVeg") || undefined,
                shelfLife: text(form, "foodShelfLife") || undefined,
                ingredients: list(text(form, "foodIngredients")),
                servingSize: text(form, "foodServingSize") || undefined,
                calories: numberValue(form, "foodCalories"),
              }
            : undefined,
        price: sPrice || 0,
        originalPrice: oPrice,
        isGstApplicable: form.get("isGstApplicable") === "on",
        gstPercentage: numberValue(form, "gstPercentage") || 0,
        sizeChartId: sizeChartId || undefined,
        description: text(form, "description") || undefined,
        shortDescription: text(form, "shortDescription") || undefined,
        variants: variants.map((variant) => ({
          ...variant,
          stock: Number(variant.stock || 0),
          price:
            variant.price === undefined || variant.price === null ? undefined : Number(variant.price),
        })),
        details: {
          sku: text(form, "baseSku") || undefined,
          fit: text(form, "fit") || undefined,
          pattern: text(form, "pattern") || undefined,
          material: text(form, "material") || undefined,
          collar: text(form, "collar") || undefined,
          sleeve: text(form, "sleeve") || undefined,
          washCare: text(form, "washCare") || undefined,
        },
        tags: list(text(form, "tags")),
        seo: {
          metaTitle: text(form, "metaTitle") || undefined,
          metaDescription: text(form, "metaDescription") || undefined,
          keywords: list(text(form, "keywords")),
        },
        deliveryInfo: {
          isExpressAvailable,
          isCodAvailable,
          estimatedDays: numberValue(form, "estimatedDays") || 3,
          returnPolicy: text(form, "deliveryReturnPolicy") || undefined,
        },
        compliance: {
          manufacturerDetail: text(form, "manufacturerDetail") || undefined,
          packerDetail: text(form, "packerDetail") || undefined,
          countryOfOrigin: text(form, "countryOfOrigin") || "India",
        },
        policyRefs: {
          returnPolicy: returnPolicyId || undefined,
          refundPolicy: refundPolicyId || undefined,
          shippingPolicy: shippingPolicyId || undefined,
          termsPolicy: termsPolicyId || undefined,
        },
        refundPolicy: refundPolicyId || undefined,
        existingImages,
      },
      newImages,
      () => changeOpen(false)
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <CatalogVerticalTabs
            value={vertical}
            onChange={changeVertical}
            disabled={Boolean(product)}
          />
          {categoryBlocked && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              No categories available. Please contact administrator.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="title" label="Product Name" defaultValue={product?.title} required />
            <Field name="brand" label="Brand" defaultValue={product?.brand} optional />
            <label className={labelClass}>
              Category
              <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
              <select
                name="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory("");
                }}
                required
                disabled={categoryBlocked}
                className={selectClass}
              >
                <option value="">Select category</option>
                {visibleCategoryOptions.map((category) => (
                  <option key={category._id} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Subcategory
              <span className="text-[10px] normal-case text-muted-foreground">Optional</span>
              <select
                name="subCategory"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                disabled={subCategories.length === 0}
                className={selectClass}
              >
                <option value="">No subcategory selected</option>
                {subCategories.map((sub: any) => (
                  <option key={sub._id} value={sub.title}>
                    {sub.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Gender
              <span className="text-[10px] normal-case text-muted-foreground">Optional</span>
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={selectClass}
              >
                <option value="">Select Gender</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Unisex">Unisex</option>
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2 md:col-span-2">
              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  Selling Price
                  <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
                </span>
                <Input
                  name="price"
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min="0"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  MRP / Original Price
                  <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
                </span>
                <Input
                  name="originalPrice"
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min="0"
                  className={inputClass}
                />
              </label>
              {discountPercentage > 0 && (
                <div className="md:col-span-2 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                  Calculated Discount: {discountPercentage}% OFF
                </div>
              )}
              {priceError && (
                <div className="md:col-span-2 rounded border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
                  {priceError}
                </div>
              )}
              <div className="md:col-span-2 grid gap-3 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">Seller net estimate</span>
                  <span className="text-muted-foreground">Hybrid marketplace model</span>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded border border-border bg-muted px-3 py-2">
                    <div className="text-muted-foreground">Selling price</div>
                    <div className="mt-1 font-semibold text-foreground">Rs. {formatAmount(sellingPriceNumber)}</div>
                  </div>
                  <div className="rounded border border-border bg-muted px-3 py-2">
                    <div className="text-muted-foreground">Commission ({commissionPercent}%)</div>
                    <div className="mt-1 font-semibold text-amber-800 dark:text-amber-200">- Rs. {formatAmount(estimatedCommission)}</div>
                  </div>
                  <div className="rounded border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                    <div className="text-emerald-100/80">Estimated seller payout</div>
                    <div className="mt-1 font-semibold text-emerald-800 dark:text-emerald-200">Rs. {formatAmount(estimatedSellerNet)}</div>
                  </div>
                </div>
                <div className="rounded border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-blue-100/90">
                  Delivery rider payout is funded from visible customer delivery/dynamic charges plus platform commission. It is not added as a hidden seller deduction.
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded border border-border px-3 py-2">0-3 km: Rs. {formatAmount(payoutRules.upto3Km ?? 20)}</div>
                  <div className="rounded border border-border px-3 py-2">3-5 km: Rs. {formatAmount(payoutRules.upto5Km ?? 30)}</div>
                  <div className="rounded border border-border px-3 py-2">5-8 km: Rs. {formatAmount(payoutRules.upto8Km ?? 45)}</div>
                  <div className="rounded border border-border px-3 py-2">After 8 km: +Rs. {formatAmount(payoutRules.extraPerKmAfter8 ?? 5)}/km</div>
                </div>
                <div className="grid gap-2 md:grid-cols-4 text-muted-foreground">
                  <div>Rain bonus: Rs. {formatAmount(bonusRules.rainBonus ?? 0)}</div>
                  <div>Peak bonus: Rs. {formatAmount(bonusRules.peakBonus ?? 0)}</div>
                  <div>Festival bonus: Rs. {formatAmount(bonusRules.festivalBonus ?? 0)}</div>
                  <div>Night bonus: Rs. {formatAmount(bonusRules.nightBonus ?? 0)}</div>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <input name="isGstApplicable" type="checkbox" defaultChecked={Boolean(product?.isGstApplicable)} />
              GST Applicable
            </label>
            <Field
              name="gstPercentage"
              label="GST Percentage"
              type="number"
              defaultValue={product?.gstPercentage || 0}
              optional
            />
            <Field
              name="baseSku"
              label="Product SKU"
              defaultValue={product?.details?.sku}
              disabled
              helper="Auto-generated by backend."
            />
            <Field
              name="tags"
              label="Tags"
              defaultValue={(product?.tags || []).join(", ")}
              optional
              helper="Comma separated."
            />
            <Field
              name="keywords"
              label="SEO Keywords"
              defaultValue={(product?.seo?.keywords || []).join(", ")}
              optional
              helper="Comma separated."
            />
            <Field name="metaTitle" label="SEO Meta Title" defaultValue={product?.seo?.metaTitle} optional />
            <Field
              name="metaDescription"
              label="SEO Meta Description"
              defaultValue={product?.seo?.metaDescription}
              optional
            />
            <Field
              name="shortDescription"
              label="Short Description"
              defaultValue={product?.shortDescription}
              optional
            />
            <Field name="description" label="Full Description" defaultValue={product?.description} optional />
          </div>
          <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">Media</div>
                <div className="text-xs text-muted-foreground">
                  {totalImages}/5 images selected. At least one image is required.
                </div>
              </div>
              <Input
                type="file"
                multiple
                accept="image/*"
                className="max-w-xs border-border bg-muted text-foreground"
                onChange={chooseImages}
                disabled={totalImages >= 5}
              />
            </div>
            {imageError && <div className="text-xs text-red-700 dark:text-red-300">{imageError}</div>}
            <div className="grid gap-2 md:grid-cols-2">
              {existingImages.map((image, index) => (
                <div
                  key={`${image.fileId}-${index}`}
                  className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <img
                      src={image.url}
                      alt="Product Preview"
                      className="h-10 w-10 rounded object-cover border border-border"
                    />
                    <span className="truncate">{image.url}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-700 dark:text-red-300 hover:bg-red-400/10 hover:text-red-800 dark:hover:text-red-200 shrink-0"
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
                    className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <img
                        src={previewUrl}
                        alt="New Preview"
                        className="h-10 w-10 rounded object-cover border border-border"
                      />
                      <span className="truncate">{image.name}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-700 dark:text-red-300 hover:bg-red-400/10 hover:text-red-800 dark:hover:text-red-200 shrink-0"
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
          </section>

          <SellerVariantEditor variants={variants} onChange={setVariants} />

          {vertical === "CLOTHING" && (
            <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
              <div className="text-sm font-medium text-foreground">Size Chart</div>
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
              <div className="text-xs text-blue-700 dark:text-blue-300/90 bg-blue-500/5 border border-blue-500/20 rounded p-2">
                {selectedChart.description}
              </div>
            )}
            {selectedChart && <SizeChartPreview chart={selectedChart} />}
          </section>
          )}

          {vertical === "JEWELERY" && (
            <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
              <div className="text-sm font-medium text-foreground">Jewelry Details</div>
              <div className="text-xs text-muted-foreground">
                BIS hallmark fields. Metal type, purity and weight are required.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  name="jeweleryMetalType"
                  label="Metal Type"
                  defaultValue={product?.jeweleryDetails?.metalType}
                  required
                  helper="e.g. 22K Yellow Gold."
                />
                <label className={labelClass}>
                  Purity
                  <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
                  <select
                    name="jeweleryPurity"
                    defaultValue={product?.jeweleryDetails?.purity || ""}
                    required
                    className={selectClass}
                  >
                    <option value="">Select purity</option>
                    {JEWELERY_PURITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  name="jeweleryWeightGrams"
                  label="Weight (grams)"
                  type="number"
                  defaultValue={product?.jeweleryDetails?.weightGrams ?? ""}
                  required
                  helper="Net metal weight."
                />
                <Field
                  name="jeweleryBisMark"
                  label="BIS / HUID Mark"
                  defaultValue={product?.jeweleryDetails?.bisMark}
                  optional
                />
                <Field
                  name="jeweleryGemstone"
                  label="Gemstone"
                  defaultValue={product?.jeweleryDetails?.gemstone}
                  optional
                  helper="e.g. Ruby, Diamond."
                />
                <Field
                  name="jeweleryStoneWeightCt"
                  label="Stone Weight (ct)"
                  type="number"
                  defaultValue={product?.jeweleryDetails?.stoneWeightCt ?? ""}
                  optional
                />
                <Field
                  name="jeweleryMakingCharge"
                  label="Making Charge (₹)"
                  type="number"
                  defaultValue={product?.jeweleryDetails?.makingCharge ?? ""}
                  optional
                />
                <Field
                  name="jeweleryWastagePct"
                  label="Wastage (%)"
                  type="number"
                  defaultValue={product?.jeweleryDetails?.wastagePct ?? ""}
                  optional
                />
                <Field
                  name="jeweleryCertNo"
                  label="Certificate No."
                  defaultValue={product?.jeweleryDetails?.certNo}
                  optional
                />
                <Field
                  name="jeweleryCertUrl"
                  label="Certificate URL"
                  defaultValue={product?.jeweleryDetails?.certUrl}
                  optional
                />
                <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <input
                    name="jeweleryHallmark"
                    type="checkbox"
                    defaultChecked={Boolean(product?.jeweleryDetails?.hallmark)}
                  />
                  Hallmarked
                </label>
              </div>
            </section>
          )}

          {vertical === "FOOD" && (
            <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
              <div className="text-sm font-medium text-foreground">Food Details</div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className={labelClass}>
                  Veg / Non-Veg
                  <select
                    name="foodVegNonVeg"
                    defaultValue={product?.foodDetails?.vegNonVeg || ""}
                    className={selectClass}
                  >
                    <option value="">Select type</option>
                    {FOOD_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  name="foodShelfLife"
                  label="Shelf Life"
                  defaultValue={product?.foodDetails?.shelfLife}
                  optional
                  helper="e.g. 6 months."
                />
                <Field
                  name="foodIngredients"
                  label="Ingredients"
                  defaultValue={(product?.foodDetails?.ingredients || []).join(", ")}
                  optional
                  helper="Comma separated."
                />
                <Field
                  name="foodServingSize"
                  label="Serving Size"
                  defaultValue={product?.foodDetails?.servingSize}
                  optional
                />
                <Field
                  name="foodCalories"
                  label="Calories"
                  type="number"
                  defaultValue={product?.foodDetails?.calories ?? ""}
                  optional
                />
              </div>
            </section>
          )}

          <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
            <div className="text-sm font-medium text-foreground">Policies</div>
            <div className="text-xs text-muted-foreground">
              Select admin-approved policies for return, refund, shipping, and terms.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Return Policy
                <select
                  value={returnPolicyId}
                  onChange={(e) => setReturnPolicyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No Return Policy</option>
                  {refundPolicies
                    .filter((p) => p.policyType === "RETURN" || !p.policyType)
                    .map((policy) => (
                      <option key={policy._id} value={policy._id}>
                        {policy.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className={labelClass}>
                Refund Policy
                <select
                  value={refundPolicyId}
                  onChange={(e) => setRefundPolicyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No Refund Policy</option>
                  {refundPolicies
                    .filter((p) => p.policyType === "REFUND" || !p.policyType)
                    .map((policy) => (
                      <option key={policy._id} value={policy._id}>
                        {policy.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className={labelClass}>
                Shipping Policy
                <select
                  value={shippingPolicyId}
                  onChange={(e) => setShippingPolicyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No Shipping Policy</option>
                  {refundPolicies
                    .filter((p) => p.policyType === "SHIPPING")
                    .map((policy) => (
                      <option key={policy._id} value={policy._id}>
                        {policy.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className={labelClass}>
                Terms Policy
                <select
                  value={termsPolicyId}
                  onChange={(e) => setTermsPolicyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No Terms Policy</option>
                  {refundPolicies
                    .filter((p) => p.policyType === "TERMS")
                    .map((policy) => (
                      <option key={policy._id} value={policy._id}>
                        {policy.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
            <div className="text-sm font-medium text-foreground">Delivery & Compliance</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground h-9">
                <span>Express Delivery</span>
                <Switch checked={isExpressAvailable} onCheckedChange={setIsExpressAvailable} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground h-9">
                <span>COD Available</span>
                <Switch checked={isCodAvailable} onCheckedChange={setIsCodAvailable} />
              </div>
              <Field
                name="estimatedDays"
                label="Estimated Delivery Days"
                type="number"
                defaultValue={product?.deliveryInfo?.estimatedDays || 3}
                required
              />
              <Field
                name="deliveryReturnPolicy"
                label="Delivery Return Statement"
                defaultValue={product?.deliveryInfo?.returnPolicy}
                optional
              />
              <Field
                name="countryOfOrigin"
                label="Country of Origin"
                defaultValue={product?.compliance?.countryOfOrigin || "India"}
                required
              />
              <Field
                name="manufacturerDetail"
                label="Manufacturer Detail"
                defaultValue={product?.compliance?.manufacturerDetail}
                optional
              />
              <Field
                name="packerDetail"
                label="Packer Detail"
                defaultValue={product?.compliance?.packerDetail}
                optional
              />
            </div>
          </section>
          <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
            <div className="text-sm font-medium text-foreground">Specifications</div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field name="fit" label="Fit" defaultValue={product?.details?.fit} optional />
              <Field name="pattern" label="Pattern" defaultValue={product?.details?.pattern} optional />
              <Field name="material" label="Material" defaultValue={product?.details?.material} optional />
              <Field name="collar" label="Collar" defaultValue={product?.details?.collar} optional />
              <Field name="sleeve" label="Sleeve" defaultValue={product?.details?.sleeve} optional />
              <Field name="washCare" label="Wash Care" defaultValue={product?.details?.washCare} optional />
            </div>
          </section>
          <DialogFooter className="border-border bg-muted gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => changeOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={categoryBlocked || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {product ? "Save Changes" : "Save Draft"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SellerVariantEditor({
  variants,
  onChange,
}: {
  variants: ProductVariantPayload[];
  onChange: (variants: ProductVariantPayload[]) => void;
}) {
  const update = (index: number, key: keyof ProductVariantPayload, value: string) => {
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
      })
    );
  };

  return (
    <section className="grid gap-3 rounded-lg border border-border bg-muted p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Product Variants</div>
          <div className="text-xs text-muted-foreground">
            Size, color, and stock are required. SKU can stay blank for auto-generation.
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border bg-muted text-foreground hover:bg-muted"
          onClick={() => onChange([...variants, { size: "", color: "", stock: 0, sku: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Variant
        </Button>
      </div>
      {variants.map((variant, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={labelClass}>
            Size
            <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
            <Input
              value={variant.size}
              onChange={(event) => update(index, "size", event.target.value)}
              required
              placeholder="M"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Color
            <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
            <Input
              value={variant.color}
              onChange={(event) => update(index, "color", event.target.value)}
              required
              placeholder="White"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Variant Price
            <span className="text-[10px] normal-case text-muted-foreground">Optional</span>
            <Input
              value={variant.price ?? ""}
              onChange={(event) => update(index, "price", event.target.value)}
              type="number"
              min="0"
              placeholder="899"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Stock
            <span className="text-[10px] normal-case text-red-700 dark:text-red-300">Required</span>
            <Input
              value={variant.stock}
              onChange={(event) => update(index, "stock", event.target.value)}
              type="number"
              min="0"
              required
              placeholder="0"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Variant SKU
            <span className="text-[10px] normal-case text-muted-foreground">Auto-generated</span>
            <Input
              value={variant.sku || ""}
              disabled
              placeholder="Auto-generated"
              className={inputClass}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-red-700 dark:text-red-300 hover:bg-red-400/10 hover:text-red-800 dark:hover:text-red-200"
              onClick={() =>
                onChange(variants.filter((_, currentIndex) => currentIndex !== index))
              }
              disabled={variants.length === 1}
              aria-label="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}

function SizeChartPreview({ chart }: { chart: SellerSizeChart }) {
  const fields = chart.fields?.length ? chart.fields : Object.keys(chart.data?.[0] || {});
  const rows = (chart.data || []).slice(0, 5);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
        {chart.name} - {chart.category} - {chart.unit}
      </div>
      {rows.length > 0 && fields.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground">
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
                <tr key={index} className="border-t border-border text-muted-foreground">
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
        <div className="px-3 py-2 text-xs text-muted-foreground">No preview rows available.</div>
      )}
    </div>
  );
}


function sellerAssignedCategoryOptions(categories?: any) {
  return (categories?.available || []).filter(
    (category: any) =>
      category.isActive !== false && !category.parentId
  );
}

function categoryKey(value?: string) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function entityId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) return String((value as { _id?: string })._id || "");
  return "";
}
