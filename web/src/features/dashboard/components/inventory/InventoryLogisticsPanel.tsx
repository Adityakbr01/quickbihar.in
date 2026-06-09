"use client";

import { type FormEvent, useState } from "react";
import { Boxes, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminListParams,
  AdminInventoryProduct,
  Warehouse,
  ShippingProvider,
} from "../../api/adminManagement.api";
import {
  useInventory,
  useWarehouses,
  useShippingProviders,
  useUpdateInventoryStock,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useCreateShippingProvider,
  useUpdateShippingProvider,
  useDeleteShippingProvider,
} from "../../hooks/useAdminManagement";
import {
  SectionHeader,
  TabButtons,
  ModuleToolbar,
  LoadingState,
  EmptyState,
  PaginationFooter,
  splitComma,
  setDraftField,
} from "../shared/AdminFullHelpers";
import { inputClass, selectClass, formatDate, downloadCsv } from "../../utils";

type LogisticsKind = "inventory" | "warehouses" | "shipping";

const logisticsTabs: Array<{ id: LogisticsKind; label: string }> = [
  { id: "inventory", label: "Inventory" },
  { id: "warehouses", label: "Warehouses" },
  { id: "shipping", label: "Shipping Providers" },
];

export function InventoryLogisticsPanel() {
  const [tab, setTab] = useState<LogisticsKind>("inventory");
  const [params, setParams] = useState<AdminListParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [warehouseDraft, setWarehouseDraft] = useState<Record<string, any>>({});
  const [shippingDraft, setShippingDraft] = useState<Record<string, any>>({});
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);
  const [stockDraft, setStockDraft] = useState<{
    productId: string;
    sku: string;
    stock: string;
    reason?: string;
  } | null>(null);

  const inventoryQuery = useInventory(params);
  const warehousesQuery = useWarehouses(params);
  const providersQuery = useShippingProviders(params);
  const updateStock = useUpdateInventoryStock();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const createProvider = useCreateShippingProvider();
  const updateProvider = useUpdateShippingProvider();
  const deleteProvider = useDeleteShippingProvider();

  const currentQuery =
    tab === "inventory"
      ? inventoryQuery
      : tab === "warehouses"
      ? warehousesQuery
      : providersQuery;

  const submitWarehouse = (event: FormEvent) => {
    event.preventDefault();
    const payload = warehousePayload(warehouseDraft);
    if (editingWarehouse?._id)
      updateWarehouse.mutate(
        { id: editingWarehouse._id, payload },
        {
          onSuccess: () => {
            setWarehouseDraft({});
            setEditingWarehouse(null);
          },
        }
      );
    else createWarehouse.mutate(payload, { onSuccess: () => setWarehouseDraft({}) });
  };

  const submitProvider = (event: FormEvent) => {
    event.preventDefault();
    const payload = providerPayload(shippingDraft);
    if (editingProvider?._id)
      updateProvider.mutate(
        { id: editingProvider._id, payload },
        {
          onSuccess: () => {
            setShippingDraft({});
            setEditingProvider(null);
          },
        }
      );
    else createProvider.mutate(payload, { onSuccess: () => setShippingDraft({}) });
  };

  const submitStock = (event: FormEvent) => {
    event.preventDefault();
    if (!stockDraft) return;
    updateStock.mutate(
      {
        productId: stockDraft.productId,
        sku: stockDraft.sku,
        stock: Number(stockDraft.stock),
        reason: stockDraft.reason,
      },
      { onSuccess: () => setStockDraft(null) }
    );
  };

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Boxes className="h-4 w-4" />}
        title="Inventory & Logistics"
        actionLabel={
          tab === "inventory"
            ? undefined
            : tab === "warehouses"
            ? "Add Warehouse"
            : "Add Provider"
        }
        onAction={
          tab === "warehouses"
            ? () => setWarehouseDraft(defaultWarehouseDraft())
            : tab === "shipping"
            ? () => setShippingDraft(defaultProviderDraft())
            : undefined
        }
        onRefresh={() => currentQuery.refetch()}
      />
      <TabButtons
        tabs={logisticsTabs}
        value={tab}
        onChange={(value) => {
          setTab(value as LogisticsKind);
          setParams((current) => ({ ...current, page: 1 }));
        }}
      />
      <ModuleToolbar
        search={params.search || ""}
        status={params.status || "ALL"}
        statuses={
          tab === "inventory"
            ? ["ALL", "low-stock", "out-of-stock", "active", "inactive"]
            : ["ALL", "active", "inactive"]
        }
        onSearch={(value) =>
          setParams((current) => ({
            ...current,
            search: value || undefined,
            page: 1,
          }))
        }
        onStatus={(value) =>
          setParams((current) => ({ ...current, status: value, page: 1 }))
        }
        onExport={() =>
          exportLogistics(
            tab,
            inventoryQuery.data?.data || [],
            warehousesQuery.data?.data || [],
            providersQuery.data?.data || []
          )
        }
      />
      {tab === "inventory" && (
        <InventoryTable
          products={inventoryQuery.data?.data || []}
          isLoading={inventoryQuery.isLoading}
          lowStock={inventoryQuery.data?.lowStockCount || 0}
          outOfStock={inventoryQuery.data?.outOfStockCount || 0}
          onStock={(product, sku, stock) =>
            setStockDraft({
              productId: product._id,
              sku,
              stock: String(stock),
              reason: "Admin adjustment",
            })
          }
        />
      )}
      {tab === "warehouses" && (
        <WarehouseTable
          rows={warehousesQuery.data?.data || []}
          isLoading={warehousesQuery.isLoading}
          onEdit={(warehouse) => {
            setEditingWarehouse(warehouse);
            setWarehouseDraft(warehouseToDraft(warehouse));
          }}
          onDelete={(warehouse) =>
            window.confirm("Deactivate this warehouse?") &&
            deleteWarehouse.mutate(warehouse._id)
          }
        />
      )}
      {tab === "shipping" && (
        <ShippingProviderTable
          rows={providersQuery.data?.data || []}
          isLoading={providersQuery.isLoading}
          onEdit={(provider) => {
            setEditingProvider(provider);
            setShippingDraft(providerToDraft(provider));
          }}
          onDelete={(provider) =>
            window.confirm("Deactivate this provider?") &&
            deleteProvider.mutate(provider._id)
          }
        />
      )}
      {tab === "inventory" && Boolean(inventoryQuery.data?.movements?.length) && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <CardTitle className="text-white">Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {inventoryQuery.data?.movements.map((movement) => (
              <div
                key={movement._id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <div>
                  <div className="text-sm text-white">
                    {movement.sku} · {movement.movementType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {movement.previousStock} to {movement.newStock} · {movement.reason}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(movement.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <PaginationFooter
        page={params.page || 1}
        totalPages={currentQuery.data?.totalPages || 1}
        onPage={(page) => setParams((current) => ({ ...current, page }))}
      />
      <Dialog
        open={Boolean(Object.keys(warehouseDraft).length)}
        onOpenChange={(open) => {
          if (!open) {
            setWarehouseDraft({});
            setEditingWarehouse(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit" : "Add"} Warehouse
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitWarehouse}>
            <Input
              required
              className={inputClass}
              placeholder="Warehouse name"
              value={warehouseDraft.name || ""}
              onChange={(event) =>
                setDraftField(setWarehouseDraft, "name", event.target.value)
              }
            />
            <Input
              required
              className={inputClass}
              placeholder="Code"
              value={warehouseDraft.code || ""}
              onChange={(event) =>
                setDraftField(setWarehouseDraft, "code", event.target.value)
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                className={inputClass}
                placeholder="City"
                value={warehouseDraft.city || ""}
                onChange={(event) =>
                  setDraftField(setWarehouseDraft, "city", event.target.value)
                }
              />
              <Input
                className={inputClass}
                placeholder="State"
                value={warehouseDraft.state || ""}
                onChange={(event) =>
                  setDraftField(setWarehouseDraft, "state", event.target.value)
                }
              />
              <Input
                className={inputClass}
                placeholder="Contact phone"
                value={warehouseDraft.phone || ""}
                onChange={(event) =>
                  setDraftField(setWarehouseDraft, "phone", event.target.value)
                }
              />
              <Input
                className={inputClass}
                placeholder="Service areas"
                value={warehouseDraft.serviceAreas || ""}
                onChange={(event) =>
                  setDraftField(setWarehouseDraft, "serviceAreas", event.target.value)
                }
              />
            </div>
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(Object.keys(shippingDraft).length)}
        onOpenChange={(open) => {
          if (!open) {
            setShippingDraft({});
            setEditingProvider(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit" : "Add"} Shipping Provider
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitProvider}>
            <Input
              required
              className={inputClass}
              placeholder="Provider name"
              value={shippingDraft.name || ""}
              onChange={(event) =>
                setDraftField(setShippingDraft, "name", event.target.value)
              }
            />
            <Input
              required
              className={inputClass}
              placeholder="Code"
              value={shippingDraft.code || ""}
              onChange={(event) =>
                setDraftField(setShippingDraft, "code", event.target.value)
              }
            />
            <select
              className={selectClass}
              value={shippingDraft.type || "MANUAL"}
              onChange={(event) =>
                setDraftField(setShippingDraft, "type", event.target.value)
              }
            >
              {["MANUAL", "COURIER", "HYPERLOCAL", "AGGREGATOR"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Input
              className={inputClass}
              placeholder="Service areas"
              value={shippingDraft.serviceAreas || ""}
              onChange={(event) =>
                setDraftField(setShippingDraft, "serviceAreas", event.target.value)
              }
            />
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(stockDraft)}
        onOpenChange={(open) => !open && setStockDraft(null)}
      >
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>
          {stockDraft && (
            <form className="grid gap-3" onSubmit={submitStock}>
              <Input className={inputClass} value={stockDraft.sku} disabled />
              <Input
                required
                type="number"
                min={0}
                className={inputClass}
                value={stockDraft.stock}
                onChange={(event) =>
                  setStockDraft((current) =>
                    current ? { ...current, stock: event.target.value } : current
                  )
                }
              />
              <Input
                className={inputClass}
                placeholder="Reason"
                value={stockDraft.reason || ""}
                onChange={(event) =>
                  setStockDraft((current) =>
                    current ? { ...current, reason: event.target.value } : current
                  )
                }
              />
              <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                <Save className="h-4 w-4" />
                Update Stock
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InventoryTable({
  products,
  isLoading,
  lowStock,
  outOfStock,
  onStock,
}: {
  products: AdminInventoryProduct[];
  isLoading: boolean;
  lowStock: number;
  outOfStock: number;
  onStock: (product: AdminInventoryProduct, sku: string, stock: number) => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-white">Inventory</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-amber-400/30 text-amber-200">
              {lowStock} low
            </Badge>
            <Badge variant="outline" className="border-red-400/30 text-red-200">
              {outOfStock} out
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <LoadingState label="Loading inventory..." />}
        {!isLoading && !products.length && <EmptyState label="No inventory found." />}
        {!isLoading && Boolean(products.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Product</TableHead>
                <TableHead className="text-gray-400">Variants</TableHead>
                <TableHead className="text-gray-400">Stock</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product._id}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{product.title}</div>
                    <div className="text-xs text-gray-500">
                      {product.category || "-"} · {sellerName(product.sellerId)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-300">
                    {product.variants?.length || 0}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        (product.totalStock || 0) <= 10
                          ? "border-amber-400/30 text-amber-200"
                          : "border-white/10 text-gray-300"
                      }
                    >
                      {product.totalStock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {(product.variants || []).slice(0, 3).map((variant) => (
                        <Button
                          key={variant.sku || `${variant.size}-${variant.color}`}
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() =>
                            onStock(product, variant.sku || "", variant.stock)
                          }
                        >
                          {variant.sku || variant.size}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WarehouseTable({
  rows,
  isLoading,
  onEdit,
  onDelete,
}: {
  rows: Warehouse[];
  isLoading: boolean;
  onEdit: (row: Warehouse) => void;
  onDelete: (row: Warehouse) => void;
}) {
  return (
    <SimpleAdminTable
      title="Warehouses"
      rows={rows}
      isLoading={isLoading}
      columns={["Name", "Code", "City", "Status"]}
      render={(row) => [
        row.name,
        row.code,
        row.address?.city || "-",
        row.isActive ? "Active" : "Inactive",
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function ShippingProviderTable({
  rows,
  isLoading,
  onEdit,
  onDelete,
}: {
  rows: ShippingProvider[];
  isLoading: boolean;
  onEdit: (row: ShippingProvider) => void;
  onDelete: (row: ShippingProvider) => void;
}) {
  return (
    <SimpleAdminTable
      title="Shipping Providers"
      rows={rows}
      isLoading={isLoading}
      columns={["Name", "Code", "Type", "Status"]}
      render={(row) => [
        row.name,
        row.code,
        row.type,
        row.isActive ? "Active" : "Inactive",
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function SimpleAdminTable<T extends { _id: string }>({
  title,
  rows,
  isLoading,
  columns,
  render,
  onEdit,
  onDelete,
}: {
  title: string;
  rows: T[];
  isLoading: boolean;
  columns: string[];
  render: (row: T) => Array<string | number>;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <LoadingState label={`Loading ${title.toLowerCase()}...`} />}
        {!isLoading && !rows.length && (
          <EmptyState label={`No ${title.toLowerCase()} found.`} />
        )}
        {!isLoading && Boolean(rows.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {columns.map((column, index) => (
                  <TableHead
                    key={column}
                    className={index === 0 ? "px-4 text-gray-400" : "text-gray-400"}
                  >
                    {column}
                  </TableHead>
                ))}
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row._id}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  {render(row).map((value, index) => (
                    <TableCell
                      key={`${row._id}-${index}`}
                      className={
                        index === 0
                          ? "px-4 text-sm font-medium text-white"
                          : "text-sm text-gray-300"
                      }
                    >
                      {value}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => onEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                        onClick={() => onDelete(row)}
                      >
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
  );
}

function defaultWarehouseDraft() {
  return { name: "", code: "", city: "", state: "", phone: "", serviceAreas: "" };
}

function warehouseToDraft(warehouse: Warehouse) {
  return {
    name: warehouse.name,
    code: warehouse.code,
    city: warehouse.address?.city,
    state: warehouse.address?.state,
    phone: warehouse.contact?.phone,
    serviceAreas: warehouse.serviceAreas?.join(", "),
  };
}

function warehousePayload(draft: Record<string, any>): Partial<Warehouse> {
  return {
    name: draft.name,
    code: draft.code,
    address: { city: draft.city, state: draft.state },
    contact: { phone: draft.phone },
    serviceAreas: splitComma(draft.serviceAreas),
    isActive: true,
  };
}

function defaultProviderDraft() {
  return { name: "", code: "", type: "MANUAL", serviceAreas: "" };
}

function providerToDraft(provider: ShippingProvider) {
  return {
    name: provider.name,
    code: provider.code,
    type: provider.type,
    serviceAreas: provider.serviceAreas?.join(", "),
  };
}

function providerPayload(draft: Record<string, any>): Partial<ShippingProvider> {
  return {
    name: draft.name,
    code: draft.code,
    type: draft.type || "MANUAL",
    serviceAreas: splitComma(draft.serviceAreas),
    isActive: true,
  };
}

function exportLogistics(
  tab: LogisticsKind,
  products: AdminInventoryProduct[],
  warehouses: Warehouse[],
  providers: ShippingProvider[]
) {
  if (tab === "inventory") {
    downloadCsv("inventory.csv", [
      ["Product", "Category", "Stock"],
      ...products.map((product) => [
        product.title,
        product.category || "",
        String(product.totalStock || 0),
      ]),
    ]);
  }
  if (tab === "warehouses") {
    downloadCsv("warehouses.csv", [
      ["Name", "Code", "City", "Status"],
      ...warehouses.map((warehouse) => [
        warehouse.name,
        warehouse.code,
        warehouse.address?.city || "",
        warehouse.isActive ? "Active" : "Inactive",
      ]),
    ]);
  }
  if (tab === "shipping") {
    downloadCsv("shipping-providers.csv", [
      ["Name", "Code", "Type", "Status"],
      ...providers.map((provider) => [
        provider.name,
        provider.code,
        provider.type,
        provider.isActive ? "Active" : "Inactive",
      ]),
    ]);
  }
}

function sellerName(value: AdminInventoryProduct["sellerId"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.fullName || value.email || value._id;
}
