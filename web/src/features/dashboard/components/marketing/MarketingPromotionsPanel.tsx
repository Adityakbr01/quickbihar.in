"use client";

import { type FormEvent, useState } from "react";
import { Megaphone, Edit, Trash2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  FlashSale,
} from "../../api/adminManagement.api";
import {
  useFlashSales,
  useCreateFlashSale,
  useUpdateFlashSale,
  useDeleteFlashSale,
  useUpdateProductFeature,
} from "../../hooks/useAdminManagement";
import { useAdminProducts } from "../../hooks/useCatalogManagement";
import {
  SectionHeader,
  ModuleToolbar,
  StatusBadge,
  LoadingState,
  EmptyState,
  PaginationFooter,
  splitComma,
  setDraftField,
  toDateTimeInput,
} from "../shared/AdminFullHelpers";
import { inputClass, selectClass, textareaClass, formatAmount, formatDate, downloadCsv } from "../../utils";

export function MarketingPromotionsPanel() {
  const [params, setParams] = useState<AdminListParams>({
    page: 1,
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [editing, setEditing] = useState<FlashSale | null>(null);
  const [dateError, setDateError] = useState("");
  const flashSalesQuery = useFlashSales(params);
  const productsQuery = useAdminProducts({ page: 1, limit: 8, sortBy: "newest" });
  const createFlashSale = useCreateFlashSale();
  const updateFlashSale = useUpdateFlashSale();
  const deleteFlashSale = useDeleteFlashSale();
  const updateFeature = useUpdateProductFeature();

  const closeDialog = () => {
    setDraft({});
    setEditing(null);
    setDateError("");
  };

  const submitFlashSale = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.startsAt || !draft.endsAt) {
      setDateError("Start and end date are required.");
      return;
    }

    setDateError("");
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
      updateFlashSale.mutate(
        { id: editing._id, payload },
        { onSuccess: closeDialog }
      );
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
          downloadCsv("flash-sales.csv", [
            ["Name", "Status", "Discount", "Starts", "Ends"],
            ...rows.map((sale) => [
              sale.name,
              sale.status,
              `${sale.discountValue} ${sale.discountType}`,
              sale.startsAt,
              sale.endsAt,
            ]),
          ])
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <CardTitle className="text-white">Flash Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {flashSalesQuery.isLoading && (
              <LoadingState label="Loading flash sales..." />
            )}
            {!flashSalesQuery.isLoading && !rows.length && (
              <EmptyState label="No flash sales found." />
            )}
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
                    <TableRow
                      key={sale._id}
                      className="border-white/10 hover:bg-white/[0.03]"
                    >
                      <TableCell className="px-4">
                        <div className="font-medium text-white">{sale.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(sale.startsAt)} to {formatDate(sale.endsAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">
                        {sale.discountValue}{" "}
                        {sale.discountType === "PERCENTAGE" ? "%" : "Rs."}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={sale.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => {
                              setEditing(sale);
                              setDraft(flashSaleToDraft(sale));
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                            onClick={() =>
                              window.confirm("Delete this flash sale?") &&
                              deleteFlashSale.mutate(sale._id)
                            }
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
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <CardTitle className="text-white">Featured Products</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {productsQuery.isLoading && <LoadingState label="Loading products..." />}
            {!productsQuery.isLoading && !products.length && (
              <EmptyState label="No products found." />
            )}
            {products.map((product) => (
              <div
                key={product._id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {product.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rs. {formatAmount(product.price)} · Stock{" "}
                      {product.totalStock || 0}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-gray-300">
                    {product.category}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ToggleButton
                    active={Boolean(product.isFeatured)}
                    label="Featured"
                    onClick={() =>
                      updateFeature.mutate({
                        productId: product._id,
                        payload: { isFeatured: !product.isFeatured },
                      })
                    }
                  />
                  <ToggleButton
                    active={Boolean(product.isTrending)}
                    label="Trending"
                    onClick={() =>
                      updateFeature.mutate({
                        productId: product._id,
                        payload: { isTrending: !product.isTrending },
                      })
                    }
                  />
                  <ToggleButton
                    active={Boolean(product.isNewArrival)}
                    label="New Arrival"
                    onClick={() =>
                      updateFeature.mutate({
                        productId: product._id,
                        payload: { isNewArrival: !product.isNewArrival },
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <PaginationFooter
        page={params.page || 1}
        totalPages={flashSalesQuery.data?.totalPages || 1}
        onPage={(page) => setParams((current) => ({ ...current, page }))}
      />
      <Dialog
        open={Boolean(Object.keys(draft).length)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Create"} Flash Sale</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitFlashSale}>
            <Input
              required
              className={inputClass}
              placeholder="Campaign name"
              value={draft.name || ""}
              onChange={(event) => setDraftField(setDraft, "name", event.target.value)}
            />
            <textarea
              className={textareaClass}
              placeholder="Description"
              value={draft.description || ""}
              onChange={(event) =>
                setDraftField(setDraft, "description", event.target.value)
              }
            />
            <Input
              className={inputClass}
              placeholder="Product IDs, comma separated"
              value={draft.productIds || ""}
              onChange={(event) =>
                setDraftField(setDraft, "productIds", event.target.value)
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className={selectClass}
                value={draft.discountType || "PERCENTAGE"}
                onChange={(event) =>
                  setDraftField(setDraft, "discountType", event.target.value)
                }
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
              <Input
                required
                type="number"
                className={inputClass}
                placeholder="Discount value"
                value={draft.discountValue || ""}
                onChange={(event) =>
                  setDraftField(setDraft, "discountValue", event.target.value)
                }
              />
              <DateTimePicker
                required
                className={inputClass}
                value={draft.startsAt || ""}
                onChange={(value) => {
                  setDraftField(setDraft, "startsAt", value);
                  if (value && draft.endsAt) setDateError("");
                }}
                placeholder="Starts At"
              />
              <DateTimePicker
                required
                className={inputClass}
                value={draft.endsAt || ""}
                onChange={(value) => {
                  setDraftField(setDraft, "endsAt", value);
                  if (draft.startsAt && value) setDateError("");
                }}
                placeholder="Ends At"
              />
              {dateError && (
                <div className="text-xs text-red-300 sm:col-span-2">{dateError}</div>
              )}
              <select
                className={selectClass}
                value={draft.status || "DRAFT"}
                onChange={(event) =>
                  setDraftField(setDraft, "status", event.target.value)
                }
              >
                {["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
              <select
                className={selectClass}
                value={draft.isActive ?? "true"}
                onChange={(event) =>
                  setDraftField(setDraft, "isActive", event.target.value)
                }
              >
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

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
      }
      onClick={onClick}
    >
      {active && <CheckCircle2 className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
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
    productIds: (sale.productIds || [])
      .map((item) => (typeof item === "string" ? item : item._id))
      .join(", "),
    discountType: sale.discountType,
    discountValue: String(sale.discountValue),
    startsAt: toDateTimeInput(sale.startsAt),
    endsAt: toDateTimeInput(sale.endsAt),
    status: sale.status,
    isActive: String(sale.isActive),
  };
}
