"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { type FormEvent, useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  DatabaseBackup,
  Edit,
  FileDown,
  Megaphone,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AdminInventoryProduct,
  AdminListParams,
  AdminSystemConfig,
  Announcement,
  BlogPost,
  CMSPage,
  FAQ,
  FlashSale,
  ShippingProvider,
  Warehouse,
} from "../api/adminManagement.api";
import {
  useActivityLogs,
  useAdminReports,
  useAnnouncements,
  useAuditLogs,
  useBackups,
  useBlogPosts,
  useCMSPages,
  useCreateAnnouncement,
  useCreateBackup,
  useCreateBlogPost,
  useCreateCMSPage,
  useCreateFAQ,
  useCreateFlashSale,
  useCreateShippingProvider,
  useCreateWarehouse,
  useDeleteAnnouncement,
  useDeleteBlogPost,
  useDeleteCMSPage,
  useDeleteFAQ,
  useDeleteFlashSale,
  useDeleteShippingProvider,
  useDeleteWarehouse,
  useDryRunRestore,
  useFAQs,
  useFlashSales,
  useInventory,
  useRestoreBackup,
  useShippingProviders,
  useSystemConfig,
  useUpdateAnnouncement,
  useUpdateBlogPost,
  useUpdateCMSPage,
  useUpdateFAQ,
  useUpdateFlashSale,
  useUpdateInventoryStock,
  useUpdateProductFeature,
  useUpdateShippingProvider,
  useUpdateSystemConfig,
  useUpdateWarehouse,
  useWarehouses,
} from "../hooks/useAdminManagement";
import { useAdminProducts } from "../hooks/useCatalogManagement";

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";
const tabsClass = "flex flex-wrap gap-2";

type ContentKind = "cms" | "faq" | "blog" | "announcement";
type LogisticsKind = "inventory" | "warehouses" | "shipping";
type SystemKind = "config" | "logs" | "backups";

const contentTabs: Array<{ id: ContentKind; label: string }> = [
  { id: "cms", label: "CMS Pages" },
  { id: "faq", label: "FAQs" },
  { id: "blog", label: "Blog" },
  { id: "announcement", label: "Announcements" },
];

const logisticsTabs: Array<{ id: LogisticsKind; label: string }> = [
  { id: "inventory", label: "Inventory" },
  { id: "warehouses", label: "Warehouses" },
  { id: "shipping", label: "Shipping Providers" },
];

const systemTabs: Array<{ id: SystemKind; label: string }> = [
  { id: "config", label: "Configuration" },
  { id: "logs", label: "Logs" },
  { id: "backups", label: "Backups" },
];

export function ContentManagementPanel() {
  const [kind, setKind] = useState<ContentKind>("cms");
  const [params, setParams] = useState<AdminListParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  const cmsQuery = useCMSPages(params);
  const faqQuery = useFAQs(params);
  const blogQuery = useBlogPosts(params);
  const announcementQuery = useAnnouncements(params);
  const createCMS = useCreateCMSPage();
  const updateCMS = useUpdateCMSPage();
  const deleteCMS = useDeleteCMSPage();
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();
  const createBlog = useCreateBlogPost();
  const updateBlog = useUpdateBlogPost();
  const deleteBlog = useDeleteBlogPost();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const currentQuery = kind === "cms" ? cmsQuery : kind === "faq" ? faqQuery : kind === "blog" ? blogQuery : announcementQuery;
  const rows = currentQuery.data?.data || [];

  const startCreate = () => {
    setEditing(null);
    setDraft(defaultContentDraft(kind));
  };

  const startEdit = (item: any) => {
    setEditing(item);
    setDraft(contentToDraft(kind, item));
  };

  const closeDialog = () => {
    setEditing(null);
    setDraft({});
  };

  const deleteItem = (item: any) => {
    if (!window.confirm("Delete this item?")) return;
    if (kind === "cms") deleteCMS.mutate(item._id);
    if (kind === "faq") deleteFAQ.mutate(item._id);
    if (kind === "blog") deleteBlog.mutate(item._id);
    if (kind === "announcement") deleteAnnouncement.mutate(item._id);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = contentPayload(kind, draft);

    if (editing?._id) {
      if (kind === "cms") updateCMS.mutate({ id: editing._id, payload: payload as Partial<CMSPage> }, { onSuccess: closeDialog });
      if (kind === "faq") updateFAQ.mutate({ id: editing._id, payload: payload as Partial<FAQ> }, { onSuccess: closeDialog });
      if (kind === "blog") updateBlog.mutate({ id: editing._id, payload: payload as Partial<BlogPost> }, { onSuccess: closeDialog });
      if (kind === "announcement") updateAnnouncement.mutate({ id: editing._id, payload: payload as Partial<Announcement> }, { onSuccess: closeDialog });
      return;
    }

    if (kind === "cms") createCMS.mutate(payload as Partial<CMSPage>, { onSuccess: closeDialog });
    if (kind === "faq") createFAQ.mutate(payload as Partial<FAQ>, { onSuccess: closeDialog });
    if (kind === "blog") createBlog.mutate(payload as Partial<BlogPost>, { onSuccess: closeDialog });
    if (kind === "announcement") createAnnouncement.mutate(payload as Partial<Announcement>, { onSuccess: closeDialog });
  };

  const setParam = (key: keyof AdminListParams, value: AdminListParams[keyof AdminListParams]) => {
    setParams((current) => ({ ...current, [key]: value || undefined, page: key === "page" ? Number(value) : 1 }));
  };

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Megaphone className="h-4 w-4" />}
        title="Content Management"
        actionLabel={`Create ${contentLabel(kind)}`}
        onAction={startCreate}
        onRefresh={() => currentQuery.refetch()}
      />
      <TabButtons tabs={contentTabs} value={kind} onChange={(value) => {
        setKind(value as ContentKind);
        setParams((current) => ({ ...current, page: 1 }));
      }} />
      <ModuleToolbar
        search={params.search || ""}
        status={params.status || "ALL"}
        statuses={contentStatuses(kind)}
        onSearch={(value) => setParam("search", value)}
        onStatus={(value) => setParam("status", value)}
        onExport={() => downloadCsv(`${kind}.csv`, contentCsvRows(kind, rows))}
      />
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {currentQuery.isLoading && <LoadingState label="Loading content..." />}
          {!currentQuery.isLoading && !rows.length && <EmptyState label="No content found." />}
          {!currentQuery.isLoading && Boolean(rows.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Title</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Updated</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item: any) => (
                  <TableRow key={item._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{contentTitle(kind, item)}</div>
                      <div className="line-clamp-1 text-xs text-gray-500">{contentDescription(kind, item)}</div>
                    </TableCell>
                    <TableCell><StatusBadge value={item.status} /></TableCell>
                    <TableCell className="text-sm text-gray-400">{formatDate(item.updatedAt || item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => startEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => deleteItem(item)}>
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
      <PaginationFooter page={params.page || 1} totalPages={currentQuery.data?.totalPages || 1} onPage={(page) => setParam("page", page)} />
      <Dialog open={Boolean(Object.keys(draft).length)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Create"} {contentLabel(kind)}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submit}>
            <ContentFormFields kind={kind} draft={draft} onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))} />
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MarketingPromotionsPanel() {
  const [params, setParams] = useState<AdminListParams>({ page: 1, limit: 8, sortBy: "createdAt", sortOrder: "desc" });
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [editing, setEditing] = useState<FlashSale | null>(null);
  const flashSalesQuery = useFlashSales(params);
  const productsQuery = useAdminProducts({ page: 1, limit: 8, sortBy: "newest" });
  const createFlashSale = useCreateFlashSale();
  const updateFlashSale = useUpdateFlashSale();
  const deleteFlashSale = useDeleteFlashSale();
  const updateFeature = useUpdateProductFeature();

  const closeDialog = () => {
    setDraft({});
    setEditing(null);
  };

  const submitFlashSale = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      name: draft.name,
      slug: draft.slug || undefined,
      description: draft.description || undefined,
      productIds: splitComma(draft.productIds),
      discountType: draft.discountType || "PERCENTAGE",
      discountValue: Number(draft.discountValue || 0),
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      status: draft.status || "DRAFT",
      isActive: draft.isActive !== "false",
    };

    if (editing?._id) {
      updateFlashSale.mutate({ id: editing._id, payload }, { onSuccess: closeDialog });
      return;
    }
    createFlashSale.mutate(payload, { onSuccess: closeDialog });
  };

  const rows = flashSalesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Megaphone className="h-4 w-4" />}
        title="Marketing & Promotions"
        actionLabel="Create Flash Sale"
        onAction={() => setDraft(defaultFlashSaleDraft())}
        onRefresh={() => {
          flashSalesQuery.refetch();
          productsQuery.refetch();
        }}
      />
      <ModuleToolbar
        search={params.search || ""}
        status={params.status || "ALL"}
        statuses={["ALL", "DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"]}
        onSearch={(value) => setParams((current) => ({ ...current, search: value || undefined, page: 1 }))}
        onStatus={(value) => setParams((current) => ({ ...current, status: value, page: 1 }))}
        onExport={() => downloadCsv("flash-sales.csv", [["Name", "Status", "Discount", "Starts", "Ends"], ...rows.map((sale) => [sale.name, sale.status, `${sale.discountValue} ${sale.discountType}`, sale.startsAt, sale.endsAt])])}
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader><CardTitle className="text-white">Flash Sales</CardTitle></CardHeader>
          <CardContent className="px-0">
            {flashSalesQuery.isLoading && <LoadingState label="Loading flash sales..." />}
            {!flashSalesQuery.isLoading && !rows.length && <EmptyState label="No flash sales found." />}
            {!flashSalesQuery.isLoading && Boolean(rows.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Campaign</TableHead>
                    <TableHead className="text-gray-400">Discount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((sale) => (
                    <TableRow key={sale._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4">
                        <div className="font-medium text-white">{sale.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(sale.startsAt)} to {formatDate(sale.endsAt)}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">{sale.discountValue} {sale.discountType === "PERCENTAGE" ? "%" : "Rs."}</TableCell>
                      <TableCell><StatusBadge value={sale.status} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => {
                            setEditing(sale);
                            setDraft(flashSaleToDraft(sale));
                          }}>
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => window.confirm("Delete this flash sale?") && deleteFlashSale.mutate(sale._id)}>
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
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader><CardTitle className="text-white">Featured Products</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {productsQuery.isLoading && <LoadingState label="Loading products..." />}
            {!productsQuery.isLoading && !products.length && <EmptyState label="No products found." />}
            {products.map((product) => (
              <div key={product._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{product.title}</div>
                    <div className="text-xs text-gray-500">Rs. {formatAmount(product.price)} · Stock {product.totalStock || 0}</div>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-gray-300">{product.category}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ToggleButton active={Boolean(product.isFeatured)} label="Featured" onClick={() => updateFeature.mutate({ productId: product._id, payload: { isFeatured: !product.isFeatured } })} />
                  <ToggleButton active={Boolean(product.isTrending)} label="Trending" onClick={() => updateFeature.mutate({ productId: product._id, payload: { isTrending: !product.isTrending } })} />
                  <ToggleButton active={Boolean(product.isNewArrival)} label="New Arrival" onClick={() => updateFeature.mutate({ productId: product._id, payload: { isNewArrival: !product.isNewArrival } })} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Dialog open={Boolean(Object.keys(draft).length)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Flash Sale</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={submitFlashSale}>
            <Input required className={inputClass} placeholder="Campaign name" value={draft.name || ""} onChange={(event) => setDraftField(setDraft, "name", event.target.value)} />
            <textarea className={textareaClass} placeholder="Description" value={draft.description || ""} onChange={(event) => setDraftField(setDraft, "description", event.target.value)} />
            <Input className={inputClass} placeholder="Product IDs, comma separated" value={draft.productIds || ""} onChange={(event) => setDraftField(setDraft, "productIds", event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={selectClass} value={draft.discountType || "PERCENTAGE"} onChange={(event) => setDraftField(setDraft, "discountType", event.target.value)}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
              <Input required type="number" className={inputClass} placeholder="Discount value" value={draft.discountValue || ""} onChange={(event) => setDraftField(setDraft, "discountValue", event.target.value)} />
              <Input required type="datetime-local" className={inputClass} value={draft.startsAt || ""} onChange={(event) => setDraftField(setDraft, "startsAt", event.target.value)} />
              <Input required type="datetime-local" className={inputClass} value={draft.endsAt || ""} onChange={(event) => setDraftField(setDraft, "endsAt", event.target.value)} />
              <select className={selectClass} value={draft.status || "DRAFT"} onChange={(event) => setDraftField(setDraft, "status", event.target.value)}>
                {["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select className={selectClass} value={draft.isActive ?? "true"} onChange={(event) => setDraftField(setDraft, "isActive", event.target.value)}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InventoryLogisticsPanel() {
  const [tab, setTab] = useState<LogisticsKind>("inventory");
  const [params, setParams] = useState<AdminListParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [warehouseDraft, setWarehouseDraft] = useState<Record<string, any>>({});
  const [shippingDraft, setShippingDraft] = useState<Record<string, any>>({});
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);
  const [stockDraft, setStockDraft] = useState<{ productId: string; sku: string; stock: string; reason?: string } | null>(null);

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

  const currentQuery = tab === "inventory" ? inventoryQuery : tab === "warehouses" ? warehousesQuery : providersQuery;

  const submitWarehouse = (event: FormEvent) => {
    event.preventDefault();
    const payload = warehousePayload(warehouseDraft);
    if (editingWarehouse?._id) updateWarehouse.mutate({ id: editingWarehouse._id, payload }, { onSuccess: () => {
      setWarehouseDraft({});
      setEditingWarehouse(null);
    } });
    else createWarehouse.mutate(payload, { onSuccess: () => setWarehouseDraft({}) });
  };

  const submitProvider = (event: FormEvent) => {
    event.preventDefault();
    const payload = providerPayload(shippingDraft);
    if (editingProvider?._id) updateProvider.mutate({ id: editingProvider._id, payload }, { onSuccess: () => {
      setShippingDraft({});
      setEditingProvider(null);
    } });
    else createProvider.mutate(payload, { onSuccess: () => setShippingDraft({}) });
  };

  const submitStock = (event: FormEvent) => {
    event.preventDefault();
    if (!stockDraft) return;
    updateStock.mutate({
      productId: stockDraft.productId,
      sku: stockDraft.sku,
      stock: Number(stockDraft.stock),
      reason: stockDraft.reason,
    }, { onSuccess: () => setStockDraft(null) });
  };

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Boxes className="h-4 w-4" />}
        title="Inventory & Logistics"
        actionLabel={tab === "inventory" ? undefined : tab === "warehouses" ? "Add Warehouse" : "Add Provider"}
        onAction={tab === "warehouses" ? () => setWarehouseDraft(defaultWarehouseDraft()) : tab === "shipping" ? () => setShippingDraft(defaultProviderDraft()) : undefined}
        onRefresh={() => currentQuery.refetch()}
      />
      <TabButtons tabs={logisticsTabs} value={tab} onChange={(value) => {
        setTab(value as LogisticsKind);
        setParams((current) => ({ ...current, page: 1 }));
      }} />
      <ModuleToolbar
        search={params.search || ""}
        status={params.status || "ALL"}
        statuses={tab === "inventory" ? ["ALL", "low-stock", "out-of-stock", "active", "inactive"] : ["ALL", "active", "inactive"]}
        onSearch={(value) => setParams((current) => ({ ...current, search: value || undefined, page: 1 }))}
        onStatus={(value) => setParams((current) => ({ ...current, status: value, page: 1 }))}
        onExport={() => exportLogistics(tab, inventoryQuery.data?.data || [], warehousesQuery.data?.data || [], providersQuery.data?.data || [])}
      />
      {tab === "inventory" && (
        <InventoryTable
          products={inventoryQuery.data?.data || []}
          isLoading={inventoryQuery.isLoading}
          lowStock={inventoryQuery.data?.lowStockCount || 0}
          outOfStock={inventoryQuery.data?.outOfStockCount || 0}
          onStock={(product, sku, stock) => setStockDraft({ productId: product._id, sku, stock: String(stock), reason: "Admin adjustment" })}
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
          onDelete={(warehouse) => window.confirm("Deactivate this warehouse?") && deleteWarehouse.mutate(warehouse._id)}
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
          onDelete={(provider) => window.confirm("Deactivate this provider?") && deleteProvider.mutate(provider._id)}
        />
      )}
      {tab === "inventory" && Boolean(inventoryQuery.data?.movements?.length) && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader><CardTitle className="text-white">Recent Stock Movements</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {inventoryQuery.data?.movements.map((movement) => (
              <div key={movement._id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <div>
                  <div className="text-sm text-white">{movement.sku} · {movement.movementType}</div>
                  <div className="text-xs text-gray-500">{movement.previousStock} to {movement.newStock} · {movement.reason}</div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(movement.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <PaginationFooter page={params.page || 1} totalPages={currentQuery.data?.totalPages || 1} onPage={(page) => setParams((current) => ({ ...current, page }))} />
      <Dialog open={Boolean(Object.keys(warehouseDraft).length)} onOpenChange={(open) => {
        if (!open) {
          setWarehouseDraft({});
          setEditingWarehouse(null);
        }
      }}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader><DialogTitle>{editingWarehouse ? "Edit" : "Add"} Warehouse</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={submitWarehouse}>
            <Input required className={inputClass} placeholder="Warehouse name" value={warehouseDraft.name || ""} onChange={(event) => setDraftField(setWarehouseDraft, "name", event.target.value)} />
            <Input required className={inputClass} placeholder="Code" value={warehouseDraft.code || ""} onChange={(event) => setDraftField(setWarehouseDraft, "code", event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input className={inputClass} placeholder="City" value={warehouseDraft.city || ""} onChange={(event) => setDraftField(setWarehouseDraft, "city", event.target.value)} />
              <Input className={inputClass} placeholder="State" value={warehouseDraft.state || ""} onChange={(event) => setDraftField(setWarehouseDraft, "state", event.target.value)} />
              <Input className={inputClass} placeholder="Contact phone" value={warehouseDraft.phone || ""} onChange={(event) => setDraftField(setWarehouseDraft, "phone", event.target.value)} />
              <Input className={inputClass} placeholder="Service areas" value={warehouseDraft.serviceAreas || ""} onChange={(event) => setDraftField(setWarehouseDraft, "serviceAreas", event.target.value)} />
            </div>
            <Button type="submit" className="bg-white text-black hover:bg-gray-200"><Save className="h-4 w-4" />Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(Object.keys(shippingDraft).length)} onOpenChange={(open) => {
        if (!open) {
          setShippingDraft({});
          setEditingProvider(null);
        }
      }}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader><DialogTitle>{editingProvider ? "Edit" : "Add"} Shipping Provider</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={submitProvider}>
            <Input required className={inputClass} placeholder="Provider name" value={shippingDraft.name || ""} onChange={(event) => setDraftField(setShippingDraft, "name", event.target.value)} />
            <Input required className={inputClass} placeholder="Code" value={shippingDraft.code || ""} onChange={(event) => setDraftField(setShippingDraft, "code", event.target.value)} />
            <select className={selectClass} value={shippingDraft.type || "MANUAL"} onChange={(event) => setDraftField(setShippingDraft, "type", event.target.value)}>
              {["MANUAL", "COURIER", "HYPERLOCAL", "AGGREGATOR"].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <Input className={inputClass} placeholder="Service areas" value={shippingDraft.serviceAreas || ""} onChange={(event) => setDraftField(setShippingDraft, "serviceAreas", event.target.value)} />
            <Button type="submit" className="bg-white text-black hover:bg-gray-200"><Save className="h-4 w-4" />Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(stockDraft)} onOpenChange={(open) => !open && setStockDraft(null)}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <DialogHeader><DialogTitle>Update Stock</DialogTitle></DialogHeader>
          {stockDraft && (
            <form className="grid gap-3" onSubmit={submitStock}>
              <Input className={inputClass} value={stockDraft.sku} disabled />
              <Input required type="number" min={0} className={inputClass} value={stockDraft.stock} onChange={(event) => setStockDraft((current) => current ? { ...current, stock: event.target.value } : current)} />
              <Input className={inputClass} value={stockDraft.reason || ""} onChange={(event) => setStockDraft((current) => current ? { ...current, reason: event.target.value } : current)} />
              <Button type="submit" className="bg-white text-black hover:bg-gray-200"><Save className="h-4 w-4" />Update Stock</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ReportsAnalyticsPanel() {
  const [params, setParams] = useState<AdminListParams>({});
  const reportsQuery = useAdminReports(params);
  const summary = reportsQuery.data?.summary;

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<BarChart3 className="h-4 w-4" />}
        title="Reports & Analytics"
        actionLabel="Export Reports"
        onAction={() => reportsQuery.data && exportReports(reportsQuery.data)}
        onRefresh={() => reportsQuery.refetch()}
      />
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input type="date" className={inputClass} value={params.dateFrom || ""} onChange={(event) => setParams((current) => ({ ...current, dateFrom: event.target.value || undefined }))} />
          <Input type="date" className={inputClass} value={params.dateTo || ""} onChange={(event) => setParams((current) => ({ ...current, dateTo: event.target.value || undefined }))} />
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setParams({})}>
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </CardContent>
      </Card>
      {reportsQuery.isLoading && <LoadingState label="Loading reports..." />}
      {summary && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Revenue" value={`Rs. ${formatAmount(summary.revenue)}`} />
            <MetricCard label="Orders" value={summary.orderCount} />
            <MetricCard label="Customers" value={summary.totalCustomers} />
            <MetricCard label="Low Stock" value={summary.lowStockProducts} tone={summary.lowStockProducts ? "warning" : "normal"} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ReportTable title="Orders By Status" rows={reportsQuery.data?.ordersByStatus || []} columns={["Status", "Orders", "Revenue"]} render={(row) => [row._id, row.count, `Rs. ${formatAmount(row.revenue)}`]} />
            <ReportTable title="Product Performance" rows={reportsQuery.data?.productPerformance || []} columns={["Product", "Qty", "Revenue"]} render={(row) => [row.title || row.sku, row.quantity, `Rs. ${formatAmount(row.revenue)}`]} />
            <ReportTable title="Daily Revenue" rows={reportsQuery.data?.dailyRevenue || []} columns={["Date", "Orders", "Revenue"]} render={(row) => [row._id, row.orders, `Rs. ${formatAmount(row.revenue)}`]} />
            <ReportTable title="Customer Analytics" rows={reportsQuery.data?.customerSummary || []} columns={["Customer", "Orders", "Revenue"]} render={(row) => [row.fullName || row.email || row._id, row.orders, `Rs. ${formatAmount(row.revenue)}`]} />
          </div>
        </>
      )}
    </div>
  );
}

export function SystemSettingsPanel() {
  const [tab, setTab] = useState<SystemKind>("config");
  const [configDraft, setConfigDraft] = useState<AdminSystemConfig>({});
  const [logKind, setLogKind] = useState<"activity" | "audit">("activity");
  const [backupName, setBackupName] = useState("");
  const systemConfigQuery = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const activityQuery = useActivityLogs({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" });
  const auditQuery = useAuditLogs({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" });
  const backupsQuery = useBackups({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" });
  const createBackup = useCreateBackup();
  const dryRunRestore = useDryRunRestore();
  const restoreBackup = useRestoreBackup();

  useEffect(() => {
    if (systemConfigQuery.data) setConfigDraft(systemConfigQuery.data);
  }, [systemConfigQuery.data]);

  const saveConfig = (event: FormEvent) => {
    event.preventDefault();
    updateConfig.mutate(configDraft);
  };

  const logs = logKind === "activity" ? activityQuery.data?.data || [] : auditQuery.data?.data || [];

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Settings className="h-4 w-4" />}
        title="System Settings"
        onRefresh={() => {
          systemConfigQuery.refetch();
          activityQuery.refetch();
          auditQuery.refetch();
          backupsQuery.refetch();
        }}
      />
      <TabButtons tabs={systemTabs} value={tab} onChange={(value) => setTab(value as SystemKind)} />
      {tab === "config" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader><CardTitle className="text-white">Secure Configuration</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveConfig}>
              <div className="grid gap-3 md:grid-cols-3">
                <Input className={inputClass} placeholder="API base URL" value={configDraft.api?.baseUrl || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["api", "baseUrl"], event.target.value)} />
                <Input className={inputClass} placeholder="Payment provider" value={configDraft.payment?.provider || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["payment", "provider"], event.target.value)} />
                <select className={selectClass} value={configDraft.payment?.mode || "TEST"} onChange={(event) => updateNestedConfig(setConfigDraft, ["payment", "mode"], event.target.value)}>
                  <option value="TEST">Test Mode</option>
                  <option value="LIVE">Live Mode</option>
                </select>
                <Input className={inputClass} placeholder="Payment public key" value={configDraft.payment?.publicKey || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["payment", "publicKey"], event.target.value)} />
                <Input className={inputClass} placeholder="Payment secret key" value={configDraft.payment?.secretKey || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["payment", "secretKey"], event.target.value)} />
                <Input className={inputClass} placeholder="Webhook secret" value={configDraft.payment?.webhookSecret || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["payment", "webhookSecret"], event.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input className={inputClass} placeholder="SMTP host" value={configDraft.smtp?.host || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "host"], event.target.value)} />
                <Input type="number" className={inputClass} placeholder="SMTP port" value={configDraft.smtp?.port || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "port"], Number(event.target.value || 0))} />
                <Input className={inputClass} placeholder="SMTP username" value={configDraft.smtp?.username || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "username"], event.target.value)} />
                <Input className={inputClass} placeholder="SMTP password" value={configDraft.smtp?.password || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "password"], event.target.value)} />
                <Input className={inputClass} placeholder="From email" value={configDraft.smtp?.fromEmail || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "fromEmail"], event.target.value)} />
                <Input className={inputClass} placeholder="From name" value={configDraft.smtp?.fromName || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["smtp", "fromName"], event.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <select className={selectClass} value={configDraft.backup?.frequency || "WEEKLY"} onChange={(event) => updateNestedConfig(setConfigDraft, ["backup", "frequency"], event.target.value)}>
                  <option value="DAILY">Daily Backups</option>
                  <option value="WEEKLY">Weekly Backups</option>
                  <option value="MONTHLY">Monthly Backups</option>
                </select>
                <Input type="number" className={inputClass} placeholder="Retention days" value={configDraft.backup?.retentionDays || ""} onChange={(event) => updateNestedConfig(setConfigDraft, ["backup", "retentionDays"], Number(event.target.value || 0))} />
                <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {tab === "logs" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-white">Activity & Audit Logs</CardTitle>
              <div className="flex gap-2">
                <ToggleButton active={logKind === "activity"} label="Activity" onClick={() => setLogKind("activity")} />
                <ToggleButton active={logKind === "audit"} label="Audit" onClick={() => setLogKind("audit")} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {(activityQuery.isLoading || auditQuery.isLoading) && <LoadingState label="Loading logs..." />}
            {!logs.length && <EmptyState label="No logs found." />}
            {Boolean(logs.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Action</TableHead>
                    <TableHead className="text-gray-400">Resource</TableHead>
                    <TableHead className="text-gray-400">Actor</TableHead>
                    <TableHead className="text-gray-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4 text-sm text-white">{log.action}</TableCell>
                      <TableCell className="text-sm text-gray-300">{log.resourceType}</TableCell>
                      <TableCell className="text-sm text-gray-400">{typeof log.actorId === "object" ? log.actorId.fullName || log.actorId.email : "-"}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      {tab === "backups" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-white">Backup & Restore</CardTitle>
              <div className="flex gap-2">
                <Input className={inputClass} placeholder="Backup name" value={backupName} onChange={(event) => setBackupName(event.target.value)} />
                <Button className="bg-white text-black hover:bg-gray-200" onClick={() => createBackup.mutate({ name: backupName || undefined }, { onSuccess: () => setBackupName("") })}>
                  <DatabaseBackup className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {backupsQuery.isLoading && <LoadingState label="Loading backups..." />}
            {!backupsQuery.isLoading && !backupsQuery.data?.data?.length && <EmptyState label="No backups found." />}
            {Boolean(backupsQuery.data?.data?.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Backup</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Collections</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupsQuery.data?.data.map((backup) => (
                    <TableRow key={backup._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4">
                        <div className="text-sm font-medium text-white">{backup.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(backup.createdAt)}</div>
                      </TableCell>
                      <TableCell><StatusBadge value={backup.status} /></TableCell>
                      <TableCell className="text-sm text-gray-400">{backup.collections?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => dryRunRestore.mutate(backup._id)}>
                            Dry Run
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => window.confirm("Restore this backup?") && restoreBackup.mutate(backup._id)}>
                            Restore
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
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  actionLabel,
  onAction,
  onRefresh,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white">{icon}</div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh && (
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        )}
        {actionLabel && onAction && (
          <Button className="bg-white text-black hover:bg-gray-200" onClick={onAction}>
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function TabButtons({ tabs, value, onChange }: { tabs: Array<{ id: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div className={tabsClass}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={value === tab.id ? "default" : "outline"}
          className={value === tab.id ? "bg-white text-black hover:bg-gray-200" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

function ModuleToolbar({
  search,
  status,
  statuses,
  onSearch,
  onStatus,
  onExport,
}: {
  search: string;
  status: string;
  statuses: string[];
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onExport: () => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input className={`${inputClass} pl-9`} placeholder="Search" value={search} onChange={(event) => onSearch(event.target.value)} />
        </div>
        <select className={selectClass} value={status} onChange={(event) => onStatus(event.target.value)}>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onExport}>
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </CardContent>
    </Card>
  );
}

function ContentFormFields({ kind, draft, onChange }: { kind: ContentKind; draft: Record<string, any>; onChange: (key: string, value: any) => void }) {
  if (kind === "faq") {
    return (
      <>
        <Input required className={inputClass} placeholder="Question" value={draft.question || ""} onChange={(event) => onChange("question", event.target.value)} />
        <textarea required className={textareaClass} placeholder="Answer" value={draft.answer || ""} onChange={(event) => onChange("answer", event.target.value)} />
        <Input className={inputClass} placeholder="Category" value={draft.category || ""} onChange={(event) => onChange("category", event.target.value)} />
        <ContentStatusSelect status={draft.status || "PUBLISHED"} onChange={(value) => onChange("status", value)} />
      </>
    );
  }

  if (kind === "announcement") {
    return (
      <>
        <Input required className={inputClass} placeholder="Title" value={draft.title || ""} onChange={(event) => onChange("title", event.target.value)} />
        <textarea required className={textareaClass} placeholder="Message" value={draft.message || ""} onChange={(event) => onChange("message", event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className={selectClass} value={draft.channel || "IN_APP"} onChange={(event) => onChange("channel", event.target.value)}>
            {["IN_APP", "PUSH", "EMAIL", "SMS"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className={selectClass} value={draft.audience || "ALL"} onChange={(event) => onChange("audience", event.target.value)}>
            {["ALL", "USERS", "SELLERS", "DELIVERY"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className={selectClass} value={draft.status || "DRAFT"} onChange={(event) => onChange("status", event.target.value)}>
            {["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Input type="datetime-local" className={inputClass} value={draft.startsAt || ""} onChange={(event) => onChange("startsAt", event.target.value)} />
        </div>
      </>
    );
  }

  return (
    <>
      <Input required className={inputClass} placeholder="Title" value={draft.title || ""} onChange={(event) => onChange("title", event.target.value)} />
      <Input className={inputClass} placeholder="Slug" value={draft.slug || ""} onChange={(event) => onChange("slug", event.target.value)} />
      <Input className={inputClass} placeholder="Excerpt" value={draft.excerpt || ""} onChange={(event) => onChange("excerpt", event.target.value)} />
      {kind === "blog" && <Input className={inputClass} placeholder="Cover image URL" value={draft.coverImageUrl || ""} onChange={(event) => onChange("coverImageUrl", event.target.value)} />}
      {kind === "blog" && <Input className={inputClass} placeholder="Tags, comma separated" value={draft.tags || ""} onChange={(event) => onChange("tags", event.target.value)} />}
      <textarea required className={textareaClass} placeholder="Content" value={draft.content || ""} onChange={(event) => onChange("content", event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ContentStatusSelect status={draft.status || "DRAFT"} onChange={(value) => onChange("status", value)} />
        <Input className={inputClass} placeholder="SEO title" value={draft.metaTitle || ""} onChange={(event) => onChange("metaTitle", event.target.value)} />
      </div>
    </>
  );
}

function ContentStatusSelect({ status, onChange }: { status: string; onChange: (value: string) => void }) {
  return (
    <select className={selectClass} value={status} onChange={(event) => onChange(event.target.value)}>
      {["DRAFT", "PUBLISHED", "ARCHIVED"].map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
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
            <Badge variant="outline" className="border-amber-400/30 text-amber-200">{lowStock} low</Badge>
            <Badge variant="outline" className="border-red-400/30 text-red-200">{outOfStock} out</Badge>
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
                <TableRow key={product._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{product.title}</div>
                    <div className="text-xs text-gray-500">{product.category || "-"} · {sellerName(product.sellerId)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-300">{product.variants?.length || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={(product.totalStock || 0) <= 10 ? "border-amber-400/30 text-amber-200" : "border-white/10 text-gray-300"}>
                      {product.totalStock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {(product.variants || []).slice(0, 3).map((variant) => (
                        <Button key={variant.sku || `${variant.size}-${variant.color}`} size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onStock(product, variant.sku || "", variant.stock)}>
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

function WarehouseTable({ rows, isLoading, onEdit, onDelete }: { rows: Warehouse[]; isLoading: boolean; onEdit: (row: Warehouse) => void; onDelete: (row: Warehouse) => void }) {
  return <SimpleAdminTable title="Warehouses" rows={rows} isLoading={isLoading} columns={["Name", "Code", "City", "Status"]} render={(row) => [row.name, row.code, row.address?.city || "-", row.isActive ? "Active" : "Inactive"]} onEdit={onEdit} onDelete={onDelete} />;
}

function ShippingProviderTable({ rows, isLoading, onEdit, onDelete }: { rows: ShippingProvider[]; isLoading: boolean; onEdit: (row: ShippingProvider) => void; onDelete: (row: ShippingProvider) => void }) {
  return <SimpleAdminTable title="Shipping Providers" rows={rows} isLoading={isLoading} columns={["Name", "Code", "Type", "Status"]} render={(row) => [row.name, row.code, row.type, row.isActive ? "Active" : "Inactive"]} onEdit={onEdit} onDelete={onDelete} />;
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
      <CardHeader><CardTitle className="text-white">{title}</CardTitle></CardHeader>
      <CardContent className="px-0">
        {isLoading && <LoadingState label={`Loading ${title.toLowerCase()}...`} />}
        {!isLoading && !rows.length && <EmptyState label={`No ${title.toLowerCase()} found.`} />}
        {!isLoading && Boolean(rows.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {columns.map((column, index) => <TableHead key={column} className={index === 0 ? "px-4 text-gray-400" : "text-gray-400"}>{column}</TableHead>)}
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id} className="border-white/10 hover:bg-white/[0.03]">
                  {render(row).map((value, index) => <TableCell key={`${row._id}-${index}`} className={index === 0 ? "px-4 text-sm font-medium text-white" : "text-sm text-gray-300"}>{value}</TableCell>)}
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onEdit(row)}>
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => onDelete(row)}>
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
  );
}

function ReportTable<T>({ title, rows, columns, render }: { title: string; rows: T[]; columns: string[]; render: (row: T) => Array<string | number> }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader><CardTitle className="text-white">{title}</CardTitle></CardHeader>
      <CardContent className="px-0">
        {!rows.length && <EmptyState label="No report rows found." />}
        {Boolean(rows.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {columns.map((column, index) => <TableHead key={column} className={index === 0 ? "px-4 text-gray-400" : "text-gray-400"}>{column}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="border-white/10 hover:bg-white/[0.03]">
                  {render(row).map((value, index) => <TableCell key={`${rowIndex}-${index}`} className={index === 0 ? "px-4 text-sm font-medium text-white" : "text-sm text-gray-300"}>{value}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, tone = "normal" }: { label: string; value: string | number; tone?: "normal" | "warning" }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-normal text-gray-500">{label}</div>
        <div className={tone === "warning" ? "mt-2 text-2xl font-semibold text-amber-200" : "mt-2 text-2xl font-semibold text-white"}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" className={active ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"} onClick={onClick}>
      {active && <CheckCircle2 className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function StatusBadge({ value }: { value?: string }) {
  const status = value || "UNKNOWN";
  const tone = status.includes("ACTIVE") || status.includes("PUBLISHED") || status.includes("SENT") || status.includes("COMPLETED") || status.includes("RESTORED")
    ? "border-emerald-400/30 text-emerald-200"
    : status.includes("DRAFT") || status.includes("PENDING") || status.includes("SCHEDULED")
      ? "border-amber-400/30 text-amber-200"
      : "border-white/10 text-gray-300";
  return <Badge variant="outline" className={tone}>{status}</Badge>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-gray-400">{label}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-gray-500">{label}</div>;
}

function PaginationFooter({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="text-sm text-gray-400">{page} / {Math.max(totalPages, 1)}</span>
      <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

function defaultContentDraft(kind: ContentKind) {
  if (kind === "faq") return { question: "", answer: "", category: "General", status: "PUBLISHED" };
  if (kind === "announcement") return { title: "", message: "", channel: "IN_APP", audience: "ALL", status: "DRAFT" };
  return { title: "", slug: "", excerpt: "", content: "", status: "DRAFT", metaTitle: "" };
}

function contentToDraft(kind: ContentKind, item: any) {
  if (kind === "faq") return { question: item.question, answer: item.answer, category: item.category, status: item.status };
  if (kind === "announcement") return {
    title: item.title,
    message: item.message,
    channel: item.channel,
    audience: item.audience,
    status: item.status,
    startsAt: toDateTimeInput(item.startsAt),
  };
  return {
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content,
    coverImageUrl: item.coverImageUrl,
    tags: item.tags?.join(", "),
    status: item.status,
    metaTitle: item.seo?.metaTitle,
  };
}

function contentPayload(kind: ContentKind, draft: Record<string, any>) {
  if (kind === "faq") return {
    question: draft.question,
    answer: draft.answer,
    category: draft.category || "General",
    status: draft.status || "PUBLISHED",
  };
  if (kind === "announcement") return {
    title: draft.title,
    message: draft.message,
    channel: draft.channel || "IN_APP",
    audience: draft.audience || "ALL",
    status: draft.status || "DRAFT",
    startsAt: draft.startsAt || undefined,
  };
  return {
    title: draft.title,
    slug: draft.slug || undefined,
    excerpt: draft.excerpt || undefined,
    content: draft.content,
    coverImageUrl: kind === "blog" ? draft.coverImageUrl || undefined : undefined,
    tags: kind === "blog" ? splitComma(draft.tags) : undefined,
    status: draft.status || "DRAFT",
    seo: draft.metaTitle ? { metaTitle: draft.metaTitle } : undefined,
  };
}

function contentLabel(kind: ContentKind) {
  return kind === "cms" ? "CMS Page" : kind === "faq" ? "FAQ" : kind === "blog" ? "Blog Post" : "Announcement";
}

function contentTitle(kind: ContentKind, item: any) {
  return kind === "faq" ? item.question : item.title;
}

function contentDescription(kind: ContentKind, item: any) {
  if (kind === "faq") return item.category || "General";
  if (kind === "announcement") return item.message;
  return item.excerpt || item.slug || item.content;
}

function contentStatuses(kind: ContentKind) {
  return kind === "announcement" ? ["ALL", "DRAFT", "SCHEDULED", "SENT", "ARCHIVED"] : ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"];
}

function contentCsvRows(kind: ContentKind, rows: any[]) {
  return [
    ["Title", "Status", "Created"],
    ...rows.map((item) => [contentTitle(kind, item), item.status, item.createdAt || ""]),
  ];
}

function defaultFlashSaleDraft() {
  const now = new Date();
  const later = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return {
    name: "",
    description: "",
    productIds: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    startsAt: toDateTimeInput(now.toISOString()),
    endsAt: toDateTimeInput(later.toISOString()),
    status: "DRAFT",
    isActive: "true",
  };
}

function flashSaleToDraft(sale: FlashSale) {
  return {
    name: sale.name,
    slug: sale.slug,
    description: sale.description,
    productIds: (sale.productIds || []).map((item) => typeof item === "string" ? item : item._id).join(", "),
    discountType: sale.discountType,
    discountValue: String(sale.discountValue),
    startsAt: toDateTimeInput(sale.startsAt),
    endsAt: toDateTimeInput(sale.endsAt),
    status: sale.status,
    isActive: String(sale.isActive),
  };
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

function exportLogistics(tab: LogisticsKind, products: AdminInventoryProduct[], warehouses: Warehouse[], providers: ShippingProvider[]) {
  if (tab === "inventory") {
    downloadCsv("inventory.csv", [["Product", "Category", "Stock"], ...products.map((product) => [product.title, product.category || "", String(product.totalStock || 0)])]);
  }
  if (tab === "warehouses") {
    downloadCsv("warehouses.csv", [["Name", "Code", "City", "Status"], ...warehouses.map((warehouse) => [warehouse.name, warehouse.code, warehouse.address?.city || "", warehouse.isActive ? "Active" : "Inactive"])]);
  }
  if (tab === "shipping") {
    downloadCsv("shipping-providers.csv", [["Name", "Code", "Type", "Status"], ...providers.map((provider) => [provider.name, provider.code, provider.type, provider.isActive ? "Active" : "Inactive"])]);
  }
}

function exportReports(report: NonNullable<ReturnType<typeof useAdminReports>["data"]>) {
  downloadCsv("admin-reports.csv", [
    ["Metric", "Value"],
    ["Revenue", String(report.summary.revenue)],
    ["Orders", String(report.summary.orderCount)],
    ["Customers", String(report.summary.totalCustomers)],
    ["Low Stock", String(report.summary.lowStockProducts)],
  ]);
}

function splitComma(value?: string | string[]) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setDraftField(setter: React.Dispatch<React.SetStateAction<Record<string, any>>>, key: string, value: any) {
  setter((current) => ({ ...current, [key]: value }));
}

function updateNestedConfig(setter: React.Dispatch<React.SetStateAction<AdminSystemConfig>>, path: string[], value: any) {
  setter((current) => {
    const next: any = { ...current };
    let cursor = next;
    path.slice(0, -1).forEach((key) => {
      cursor[key] = { ...(cursor[key] || {}) };
      cursor = cursor[key];
    });
    cursor[path[path.length - 1]] = value;
    return next;
  });
}

function sellerName(value: AdminInventoryProduct["sellerId"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.fullName || value.email || value._id;
}

function formatAmount(value?: number) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
