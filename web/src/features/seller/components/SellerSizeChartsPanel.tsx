"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  SellerQueryParams,
  SellerSizeChart,
  SellerProduct,
} from "@/features/seller/api/sellerManagement.api";
import {
  useSellerSizeCharts,
  useSellerProducts,
  useSellerSizeChartMutations,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  RowActions,
  PaginationBar,
} from "./SellerHelpers";

export function SellerSizeChartsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const chartsQuery = useSellerSizeCharts(params);
  const productsQuery = useSellerProducts({ page: 1, limit: 100 });
  const mutations = useSellerSizeChartMutations();

  return (
    <ModuleCard
      title="Size Charts"
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      <div className="mb-3 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
        Size chart templates are managed by system administrators. Sellers can assign approved templates to their products.
      </div>
      <SimpleTable
        empty={chartsQuery.isLoading ? "Loading size charts..." : "No size charts found."}
        columns={["Chart", "Fields", "Scope", "Approval", "Actions"]}
        rows={(chartsQuery.data?.data || []).map((chart) => [
          <div key={`${chart._id}-chart`}>
            <div className="font-medium text-white">{chart.name}</div>
            <div className="text-xs text-gray-500">
              {chart.category} / {chart.unit}
            </div>
          </div>,
          chart.fields.join(", "),
          chart.scope || "GLOBAL",
          <StatusBadge key={`${chart._id}-status`} label={chart.approvalStatus || "APPROVED"} />,
          <RowActions key={`${chart._id}-actions`}>
            <AssignSizeChartDialog
              chart={chart}
              products={productsQuery.data?.data || []}
              onAssign={(productIds) =>
                mutations.assign.mutate({ chartId: chart._id, productIds })
              }
            />
          </RowActions>,
        ])}
      />
      <PaginationBar result={chartsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function AssignSizeChartDialog({
  chart,
  products,
  onAssign,
}: {
  chart: SellerSizeChart;
  products: SellerProduct[];
  onAssign: (productIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(chart.productIds || []);

  const toggleProduct = (productId: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Assign
          </Button>
        }
      />
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Products to Size Chart</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-80 gap-2 overflow-y-auto pt-2">
          {products.length ? (
            products.map((product) => (
              <label
                key={product._id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(product._id)}
                  onChange={(event) => toggleProduct(product._id, event.target.checked)}
                />
                <span>{product.title}</span>
              </label>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 py-6">No products found to assign.</div>
          )}
        </div>
        <DialogFooter className="border-white/10 bg-white/[0.03] gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onAssign(selected);
              setOpen(false);
            }}
          >
            <Save className="h-4 w-4" />
            Save Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
