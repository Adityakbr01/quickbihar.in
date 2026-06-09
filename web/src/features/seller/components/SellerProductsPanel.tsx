"use client";

import React, { type FormEvent, type ReactNode, useState } from "react";
import { Plus, Edit, Send, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/features/seller/api/sellerManagement.api";
import {
  useSellerProducts,
  useSellerCategories,
  useSellerStore,
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

type SellerCategoryOption = { _id: string; title: string; slug?: string; isActive?: boolean };

export function SellerProductsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const productsQuery = useSellerProducts(params);
  const categoriesQuery = useSellerCategories();
  const storeQuery = useSellerStore();
  const sizeChartsQuery = useSellerSizeCharts({ page: 1, limit: 100, approvalStatus: "APPROVED" });
  const refundPoliciesQuery = useSellerPolicies();
  const mutations = useSellerProductMutations();

  const assignedCategoryOptions = sellerAssignedCategoryOptions(categoriesQuery.data);
  const productCreateBlocked = !assignedCategoryOptions.length;

  return (
    <ModuleCard
      title="Products"
      actions={
        <ProductDialog
          categories={assignedCategoryOptions}
          store={storeQuery.data?.store}
          sizeCharts={sizeChartsQuery.data?.data || []}
          refundPolicies={refundPoliciesQuery.data || []}
          trigger={
            <Button disabled={productCreateBlocked}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          }
          onSubmit={(payload, images) => mutations.create.mutate({ payload, images })}
        />
      }
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      {productCreateBlocked && (
        <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Product creation is available after your store has active assigned categories.
        </div>
      )}
      <SimpleTable
        empty={productsQuery.isLoading ? "Loading products..." : "No products found."}
        columns={["Product", "Category", "Price", "Stock", "Approval", "Actions"]}
        rows={(productsQuery.data?.data || []).map((product) => [
          <div key={`${product._id}-title`} className="min-w-48">
            <div className="font-medium text-white">{product.title}</div>
            <div className="text-xs text-gray-500">
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
              sizeCharts={sizeChartsQuery.data?.data || []}
              refundPolicies={refundPoliciesQuery.data || []}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Edit
                </Button>
              }
              onSubmit={(payload, images) =>
                mutations.update.mutate({ productId: product._id, payload, images })
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
              onClick={() => mutations.submit.mutate(product._id)}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <DeleteButton onDelete={() => mutations.remove.mutate(product._id)} />
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
  sizeCharts,
  refundPolicies,
  trigger,
  onSubmit,
}: {
  product?: SellerProduct;
  categories: SellerCategoryOption[];
  store?: SellerStoreResponse["store"];
  sizeCharts: SellerSizeChart[];
  refundPolicies: SellerPolicy[];
  trigger: ReactNode;
  onSubmit: (payload: SellerProductPayload, images: File[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [variants, setVariants] = useState<ProductVariantPayload[]>(
    product?.variants?.length ? product.variants : [{ size: "", color: "", stock: 0, sku: "" }]
  );
  const [sizeChartId, setSizeChartId] = useState(entityId(product?.sizeChartId));

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
  const defaultCategory =
    product?.category &&
    categories.some((category) => categoryKey(category.title) === categoryKey(product.category))
      ? product.category
      : categoryOptions[0]?.title || "";
  const categoryBlocked = !categoryOptions.length;
  const selectedChart = sizeCharts.find((chart) => chart._id === sizeChartId);

  const resetDraft = () => {
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
    const form = new FormData(event.currentTarget);
    onSubmit(
      {
        title: text(form, "title"),
        brand: text(form, "brand") || undefined,
        category: text(form, "category"),
        price: numberValue(form, "price") || 0,
        originalPrice: numberValue(form, "originalPrice"),
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
      newImages
    );
    changeOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          {categoryBlocked && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Assign active categories in store setup before creating products.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="title" label="Product Name" defaultValue={product?.title} required />
            <Field name="brand" label="Brand" defaultValue={product?.brand} optional />
            <label className={labelClass}>
              Category
              <span className="text-[10px] normal-case text-red-300">Required</span>
              <select
                name="category"
                defaultValue={defaultCategory}
                required
                disabled={categoryBlocked}
                className={selectClass}
              >
                <option value="">Select assigned category</option>
                {categoryOptions.map((category) => (
                  <option key={category._id} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>
              <span className="text-xs normal-case text-gray-500">
                Only categories assigned to your store are shown.
              </span>
            </label>
            <Field name="price" label="Selling Price" type="number" defaultValue={product?.price} required />
            <Field
              name="originalPrice"
              label="MRP / Original Price"
              type="number"
              defaultValue={product?.originalPrice}
              optional
            />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
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
              optional
              helper="Leave blank to generate automatically."
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
          <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Media</div>
                <div className="text-xs text-gray-500">
                  {totalImages}/5 images selected. At least one image is required.
                </div>
              </div>
              <Input
                type="file"
                multiple
                accept="image/*"
                className="max-w-xs border-white/10 bg-white/5 text-white"
                onChange={chooseImages}
                disabled={totalImages >= 5}
              />
            </div>
            {imageError && <div className="text-xs text-red-300">{imageError}</div>}
            <div className="grid gap-2 md:grid-cols-2">
              {existingImages.map((image, index) => (
                <div
                  key={`${image.fileId}-${index}`}
                  className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300"
                >
                  <span className="truncate">{image.url}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-300 hover:bg-red-400/10 hover:text-red-200"
                    onClick={() => removeExistingImage(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {newImages.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300"
                >
                  <span className="truncate">{image.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-300 hover:bg-red-400/10 hover:text-red-200"
                    onClick={() => removeNewImage(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <SellerVariantEditor variants={variants} onChange={setVariants} />

          <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-medium text-white">Size Chart</div>
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
            {selectedChart && <SizeChartPreview chart={selectedChart} />}
          </section>

          <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-medium text-white">Policies</div>
            <div className="text-xs text-gray-500">
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
                    .filter((p) => p.policyType === "RETURN")
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
                    .filter((p) => p.policyType === "REFUND")
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

          <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-medium text-white">Delivery & Compliance</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300 h-9">
                <span>Express Delivery</span>
                <Switch checked={isExpressAvailable} onCheckedChange={setIsExpressAvailable} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300 h-9">
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
                defaultValue={product?.deliveryInfo?.returnPolicy || store?.policies?.returnPolicy}
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
          <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-medium text-white">Specifications</div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field name="fit" label="Fit" defaultValue={product?.details?.fit} optional />
              <Field name="pattern" label="Pattern" defaultValue={product?.details?.pattern} optional />
              <Field name="material" label="Material" defaultValue={product?.details?.material} optional />
              <Field name="collar" label="Collar" defaultValue={product?.details?.collar} optional />
              <Field name="sleeve" label="Sleeve" defaultValue={product?.details?.sleeve} optional />
              <Field name="washCare" label="Wash Care" defaultValue={product?.details?.washCare} optional />
            </div>
          </section>
          <DialogFooter className="border-white/10 bg-white/[0.03] gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={categoryBlocked}>
              <Save className="h-4 w-4" />
              Save Draft
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
    <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Product Variants</div>
          <div className="text-xs text-gray-500">
            Size, color, and stock are required. SKU can stay blank for auto-generation.
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
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
            <span className="text-[10px] normal-case text-red-300">Required</span>
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
            <span className="text-[10px] normal-case text-red-300">Required</span>
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
            <span className="text-[10px] normal-case text-gray-500">Optional</span>
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
            <span className="text-[10px] normal-case text-red-300">Required</span>
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
            <span className="text-[10px] normal-case text-gray-500">Optional</span>
            <Input
              value={variant.sku || ""}
              onChange={(event) => update(index, "sku", event.target.value)}
              placeholder="Auto-generated"
              className={inputClass}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-red-300 hover:bg-red-400/10 hover:text-red-200"
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
        <div className="px-3 py-2 text-xs text-gray-500">No preview rows available.</div>
      )}
    </div>
  );
}

function sellerAssignedCategoryValues(categories?: any) {
  const values = [categories?.assigned?.primaryCategory, ...(categories?.assigned?.subcategories || [])];
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

function sellerAssignedCategoryOptions(categories?: any) {
  const assigned = sellerAssignedCategoryValues(categories);
  const assignedKeys = new Set(assigned.map(categoryKey));
  return (categories?.available || []).filter(
    (category: any) =>
      category.isActive !== false &&
      (assignedKeys.has(categoryKey(category.title)) || assignedKeys.has(categoryKey(category.slug)))
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
