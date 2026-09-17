"use client";

import React, { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  PackageCheck,
  PackageSearch,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  ProductVariantPayload,
  SellerInventoryMovement,
  SellerInventoryProduct,
  SellerQueryParams,
} from "@/features/seller/api/sellerManagement.api";
import { cn } from "@/lib/utils";
import {
  useSellerInventory,
  useSellerInventoryMovements,
  useSellerStockMutation,
} from "../hooks/useSellerManagement";
import {
  EmptyState,
  ModuleCard,
  PaginationBar,
  StatusBadge,
  formatAmount,
  formatDate,
  inputClass,
  labelClass,
  selectClass,
} from "./SellerHelpers";

type InventoryStatusFilter = "ALL" | "low" | "out";

const statusFilters: Array<{ value: InventoryStatusFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out" },
];

export function SellerInventoryPanel({
  initialStatus,
}: {
  initialStatus?: InventoryStatusFilter;
}) {
  const [params, setParams] = useState<SellerQueryParams>({
    page: 1,
    limit: 12,
    status: initialStatus || "ALL",
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState("");
  const [draftStock, setDraftStock] = useState(0);
  const [reason, setReason] = useState("");

  const inventoryQuery = useSellerInventory(params);
  const products = useMemo(() => inventoryQuery.data?.data || [], [inventoryQuery.data?.data]);
  const selectedProduct = products.find((product) => product._id === selectedProductId) || null;
  const selectedVariant = selectedProduct?.variants.find((variant) => variant.sku === selectedSku) || null;
  const movementParams = useMemo(
    () => ({
      page: 1,
      limit: 8,
      search: selectedVariant?.sku || selectedProduct?.sku || "",
    }),
    [selectedProduct?.sku, selectedVariant?.sku],
  );
  const movementsQuery = useSellerInventoryMovements(movementParams);
  const updateStock = useSellerStockMutation();

  useEffect(() => {
    if (!initialStatus) {
      setParams((current) =>
        current.status && current.status !== "ALL" ? { ...current, status: "ALL", page: 1 } : current,
      );
      return;
    }
    setParams((current) =>
      current.status === initialStatus ? current : { ...current, status: initialStatus, page: 1 },
    );
  }, [initialStatus]);

  useEffect(() => {
    if (!products.length) {
      if (selectedProductId) setSelectedProductId(null);
      if (selectedSku) setSelectedSku("");
      return;
    }

    const currentProduct = products.find((product) => product._id === selectedProductId);
    if (!currentProduct) {
      setSelectedProductId(products[0]._id);
      setSelectedSku(products[0].variants[0]?.sku || "");
      return;
    }

    if (!currentProduct.variants.some((variant) => variant.sku === selectedSku)) {
      setSelectedSku(currentProduct.variants[0]?.sku || "");
    }
  }, [products, selectedProductId, selectedSku]);

  useEffect(() => {
    setDraftStock(selectedVariant?.stock ?? 0);
    setReason("");
  }, [selectedProduct?._id, selectedVariant?.sku, selectedVariant?.stock]);

  const selectProduct = (product: SellerInventoryProduct) => {
    setSelectedProductId(product._id);
    setSelectedSku(product.variants[0]?.sku || "");
  };

  const setStatus = (status: InventoryStatusFilter) => {
    setParams((current) => ({ ...current, status, page: 1 }));
  };

  const adjustStock = (delta: number) => {
    setDraftStock((current) => Math.max(0, current + delta));
  };

  const submitStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct || !selectedVariant?.sku) return;

    updateStock.mutate(
      {
        productId: selectedProduct._id,
        sku: selectedVariant.sku,
        stock: Math.max(0, Math.trunc(Number(draftStock) || 0)),
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => setReason(""),
      },
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <ModuleCard
        title="Inventory"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={params.search || ""}
                onChange={(event) =>
                  setParams((current) => ({ ...current, search: event.target.value, page: 1 }))
                }
                placeholder="Search"
                className={cn(inputClass, "w-52 pl-8")}
              />
            </div>
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatus(filter.value)}
                  className={cn(
                    "h-8 rounded-md px-3 text-xs font-medium text-gray-400 transition hover:text-white",
                    (params.status || "ALL") === filter.value && "bg-white text-black hover:text-black",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => inventoryQuery.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {inventoryQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">Loading inventory...</div>
          ) : products.length ? (
            products.map((product) => (
              <InventoryProductRow
                key={product._id}
                product={product}
                selected={product._id === selectedProduct?._id}
                onSelect={() => selectProduct(product)}
              />
            ))
          ) : (
            <EmptyState label="No inventory found." />
          )}
        </div>
        <PaginationBar result={inventoryQuery.data} params={params} onChange={setParams} />
      </ModuleCard>

      <div className="grid gap-4 self-start">
        <StockEditor
          product={selectedProduct}
          variant={selectedVariant}
          selectedSku={selectedSku}
          onSkuChange={setSelectedSku}
          draftStock={draftStock}
          onDraftStockChange={setDraftStock}
          reason={reason}
          onReasonChange={setReason}
          onAdjust={adjustStock}
          onSubmit={submitStock}
          pending={updateStock.isPending}
        />
        <MovementHistory
          movements={movementsQuery.data?.data || []}
          loading={movementsQuery.isLoading}
          sku={selectedVariant?.sku || ""}
        />
      </div>
    </div>
  );
}

function InventoryProductRow({
  product,
  selected,
  onSelect,
}: {
  product: SellerInventoryProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  const totalStock = product.totalStock || 0;
  const outOfStock = totalStock === 0;
  const lowStock = !outOfStock && Boolean(product.lowStock);
  const primaryImage = product.images?.[0]?.url;
  const stockLabel = outOfStock ? "OUT" : lowStock ? "LOW" : "OK";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-emerald-400/30 hover:bg-white/[0.05] md:grid-cols-[56px_minmax(0,1fr)_auto]",
        selected && "border-emerald-400/40 bg-emerald-400/10 ring-1 ring-emerald-400/20",
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
        {primaryImage ? (
          <img src={primaryImage} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <PackageSearch className="h-5 w-5 text-gray-500" />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-semibold text-white">{product.title}</div>
          <StatusBadge label={product.approvalStatus || "APPROVED"} />
          <StatusBadge label={product.isActive === false ? "INACTIVE" : "ACTIVE"} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>{product.brand || "Brand not set"}</span>
          <span>{[product.category, product.subCategory].filter(Boolean).join(" / ") || "Category"}</span>
          <span>{product.variants.length} variants</span>
          {product.price !== undefined && <span>Rs. {formatAmount(product.price)}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.variants.slice(0, 4).map((variant) => (
            <Badge
              key={variant.sku || `${variant.size}-${variant.color}`}
              variant="outline"
              className="border-white/10 bg-black/20 text-[11px] text-gray-300"
            >
              {variantLabel(variant)}: {variant.stock}
            </Badge>
          ))}
          {product.variants.length > 4 && (
            <Badge variant="outline" className="border-white/10 text-[11px] text-gray-400">
              +{product.variants.length - 4}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:block md:text-right">
        <div className="text-2xl font-semibold text-white">{totalStock}</div>
        <div
          className={cn(
            "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            stockLabel === "OK" && "border-emerald-400/30 text-emerald-300",
            stockLabel === "LOW" && "border-amber-400/30 text-amber-300",
            stockLabel === "OUT" && "border-red-400/30 text-red-300",
          )}
        >
          {stockLabel === "OK" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {stockLabel}
        </div>
      </div>
    </button>
  );
}

function StockEditor({
  product,
  variant,
  selectedSku,
  onSkuChange,
  draftStock,
  onDraftStockChange,
  reason,
  onReasonChange,
  onAdjust,
  onSubmit,
  pending,
}: {
  product: SellerInventoryProduct | null;
  variant: ProductVariantPayload | null;
  selectedSku: string;
  onSkuChange: (sku: string) => void;
  draftStock: number;
  onDraftStockChange: (stock: number) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onAdjust: (delta: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const canSave = Boolean(product && variant?.sku);

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Warehouse className="h-4 w-4 text-emerald-300" />
          Stock Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        {product && variant ? (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-white">{product.title}</div>
              <div className="mt-1 text-xs text-gray-500">{product._id}</div>
            </div>

            <label className={labelClass}>
              Variant
              <select
                value={selectedSku}
                onChange={(event) => onSkuChange(event.target.value)}
                className={selectClass}
              >
                {product.variants.map((item) => (
                  <option key={item.sku || `${item.size}-${item.color}`} value={item.sku || ""}>
                    {variantLabel(item)} - {item.stock} units - {item.sku || "No SKU"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-3">
              <StockInfo label="Current" value={variant.stock || 0} />
              <StockInfo label="New" value={draftStock} strong />
              <StockInfo label="Delta" value={draftStock - (variant.stock || 0)} />
            </div>

            <label className={labelClass}>
              New Stock
              <Input
                type="number"
                min={0}
                step={1}
                value={draftStock}
                onChange={(event) => onDraftStockChange(Math.max(0, Math.trunc(Number(event.target.value) || 0)))}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-5 gap-2">
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => onAdjust(-1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => onAdjust(1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => onAdjust(5)}>
                +5
              </Button>
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => onDraftStockChange(0)}>
                Set 0
              </Button>
              <Button type="button" variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200" onClick={() => onDraftStockChange(Math.max(draftStock, 20))}>
                <PackageCheck className="h-4 w-4" />
              </Button>
            </div>

            <label className={labelClass}>
              Reason
              <Input
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                maxLength={300}
                placeholder="Restock, return, correction"
                className={inputClass}
              />
            </label>

            <Button type="submit" disabled={!canSave || pending}>
              <Save className="h-4 w-4" />
              {pending ? "Saving..." : "Save Stock"}
            </Button>
          </form>
        ) : (
          <EmptyState label="No product selected." />
        )}
      </CardContent>
    </Card>
  );
}

function StockInfo({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] font-medium uppercase text-gray-500">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold text-gray-200", strong && "text-emerald-300")}>
        {value > 0 && label === "Delta" ? `+${value}` : value}
      </div>
    </div>
  );
}

function MovementHistory({
  movements,
  loading,
  sku,
}: {
  movements: SellerInventoryMovement[];
  loading: boolean;
  sku: string;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Movements</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4">
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-400">Loading movements...</div>
        ) : movements.length ? (
          movements.map((movement) => <MovementRow key={movement._id} movement={movement} />)
        ) : (
          <EmptyState label={sku ? "No movements for this SKU." : "No movements yet."} />
        )}
      </CardContent>
    </Card>
  );
}

function MovementRow({ movement }: { movement: SellerInventoryMovement }) {
  const positive = movement.quantity > 0;
  const neutral = movement.quantity === 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={movement.movementType} />
            <span className="truncate text-xs text-gray-400">{movement.variantLabel || movement.sku}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {movement.previousStock} &gt {movement.newStock}
            {movement.reason ? ` - ${movement.reason}` : ""}
          </div>
        </div>
        <div className={cn("text-sm font-semibold", positive && "text-emerald-300", !positive && !neutral && "text-red-300", neutral && "text-gray-300")}>
          {positive ? "+" : ""}
          {movement.quantity}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-gray-500">{formatDate(movement.createdAt)}</div>
    </div>
  );
}

function variantLabel(variant: ProductVariantPayload) {
  return [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku || "Variant";
}
