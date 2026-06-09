"use client";

import React, { type FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import {
  useSellerInventory,
  useSellerStockMutation,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  Field,
  PaginationBar,
  formatAmount,
  text,
  numberValue,
} from "./SellerHelpers";

export function SellerInventoryPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const inventoryQuery = useSellerInventory(params);
  const updateStock = useSellerStockMutation();

  const submitStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateStock.mutate({
      productId: text(form, "productId"),
      sku: text(form, "sku"),
      stock: numberValue(form, "stock") || 0,
      reason: text(form, "reason"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <ModuleCard title="Inventory" filters={<ListFilters params={params} onChange={setParams} />}>
        <SimpleTable
          empty={inventoryQuery.isLoading ? "Loading inventory..." : "No inventory found."}
          columns={["Product", "Variants", "Total", "Status"]}
          rows={(inventoryQuery.data?.data || []).map((product) => [
            <div key={`${product._id}-product`} className="min-w-48">
              <div className="font-medium text-white">{product.title}</div>
              <div className="text-xs text-gray-500">{product._id}</div>
            </div>,
            product.variants
              .map((variant) => `${variant.size}/${variant.color}: ${variant.stock} (${variant.sku})`)
              .join(", "),
            product.totalStock ?? 0,
            product.lowStock ? (
              <StatusBadge key={product._id} label="LOW" />
            ) : (
              <StatusBadge key={product._id} label="OK" />
            ),
          ])}
        />
        <PaginationBar result={inventoryQuery.data} params={params} onChange={setParams} />
      </ModuleCard>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Update Stock</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={submitStock} className="grid gap-3">
            <Field name="productId" label="Product ID" required />
            <Field name="sku" label="Variant SKU" required />
            <Field name="stock" label="New Stock" type="number" required />
            <Field name="reason" label="Reason" />
            <Button type="submit" disabled={updateStock.isPending}>
              <Save className="h-4 w-4" />
              Update Stock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
