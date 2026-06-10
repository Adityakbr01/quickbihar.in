"use client";

import React, { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminBanners,
  useCreateAdminBanner,
  useUpdateAdminBanner,
  useDeleteAdminBanner,
  useAdminCategories,
  useAdminProducts,
} from "../../hooks/useCatalogManagement";
import {
  ManagementToolbar,
  LoadingState,
  EmptyState,
} from "../shared/TableHelpers";
import { selectClass, inputClass, formatDate, isExpired } from "../../utils";

function redirectLabel(type: string, id?: string): string {
  if (!id) return "-";
  const map = type === "collection" ? null : redirectLabels[type as "category" | "product"];
  return map?.[id] ?? id.slice(-8);
}

let redirectLabels: Record<string, Record<string, string>> = {};

export function BannerManagementPanel() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const bannersQuery = useAdminBanners();
  const createBanner = useCreateAdminBanner();
  const updateBanner = useUpdateAdminBanner();
  const deleteBanner = useDeleteAdminBanner();
  const categoriesQuery = useAdminCategories({ page: 1, limit: 200, sortBy: "title", sortOrder: "asc" });
  const productsQuery = useAdminProducts({ page: 1, limit: 200, sortBy: "title", sortOrder: "asc" });

  redirectLabels = {
    category: Object.fromEntries((categoriesQuery.data?.data ?? []).map((c: any) => [c._id, c.title])),
    product: Object.fromEntries((productsQuery.data?.data ?? []).map((p: any) => [p._id, p.title])),
  };

  const banners = bannersQuery.data || [];

  const filteredBanners = banners.filter(
    (banner) =>
      banner.title?.toLowerCase().includes(search.toLowerCase()) ||
      banner.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
      banner.placement?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="App Banners"
        search={search}
        onSearch={setSearch}
        status="all"
        statuses={[{ value: "all", label: "All Statuses" }]}
        onStatus={() => {}}
        sortBy="priority"
        sortOptions={[
          { value: "priority", label: "Priority" },
          { value: "title", label: "Title" },
        ]}
        onSortBy={() => {}}
        sortOrder="desc"
        onSortOrder={() => {}}
        onRefresh={() => bannersQuery.refetch()}
        extraAction={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Banner
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {bannersQuery.isLoading && <LoadingState label="Loading banners..." />}
          {!bannersQuery.isLoading && !filteredBanners.length && <EmptyState label="No banners found." />}
          {!bannersQuery.isLoading && Boolean(filteredBanners.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Banner</TableHead>
                    <TableHead className="text-gray-400">Placement</TableHead>
                    <TableHead className="text-gray-400">Priority</TableHead>
                    <TableHead className="text-gray-400">Clicks/Impr</TableHead>
                    <TableHead className="text-gray-400">Schedule</TableHead>
                    <TableHead className="text-gray-400">Active</TableHead>
                    <TableHead className="text-gray-400">Updated</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <img src={banner.image} alt={banner.title || "Banner"} className="h-12 w-20 rounded object-cover" />
                          <div className="min-w-0 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-white">{banner.title || "Untitled Banner"}</span>
                              {banner.isAds && (
                                <Badge className="h-4 shrink-0 bg-amber-500/15 px-1.5 text-[10px] text-amber-400">AD</Badge>
                              )}
                              {banner.endDate && isExpired(banner.endDate) && (
                                <Badge className="h-4 shrink-0 bg-red-500/15 px-1.5 text-[10px] text-red-400">Expired</Badge>
                              )}
                            </div>
                            <div className="truncate text-xs text-gray-500">{banner.subtitle || "-"}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-600">
                              <span className="capitalize">{banner.redirectType}</span>
                              <span>·</span>
                              <span className="truncate">
                                {banner.redirectType === "external"
                                  ? banner.externalUrl
                                  : redirectLabel(banner.redirectType, banner.redirectId)}
                              </span>
                              {banner.redirectType === "external" && banner.externalUrl && (
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-cyan-400/30 text-cyan-300">
                          {banner.placement}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">{banner.priority ?? 0}</TableCell>
                      <TableCell className="text-sm text-gray-400">
                        <span className="tabular-nums">{banner.clicks ?? 0}</span>
                        <span className="mx-1 text-gray-600">/</span>
                        <span className="tabular-nums">{banner.impressions ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        <div className="text-[11px] leading-tight">{formatDate(banner.startDate)}</div>
                        <div className="text-[11px] leading-tight text-gray-600">→ {formatDate(banner.endDate)}</div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(banner.isActive)}
                          onCheckedChange={() => {
                            if (!banner.isActive && banner.endDate && isExpired(banner.endDate)) {
                              toast.error("Banner has expired. Increase the end date before activating.");
                              return;
                            }
                            updateBanner.mutate({ id: banner._id, payload: { isActive: !banner.isActive } });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{formatDate(banner.updatedAt || banner.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => setEditing(banner)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm(`Delete banner ${banner.title || ""}?`)) deleteBanner.mutate(banner._id);
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Banner</DialogTitle>
          </DialogHeader>
          <BannerForm
            isPending={createBanner.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload, image) => createBanner.mutate({ payload, image }, { onSuccess: () => setIsCreateOpen(false) })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          {editing && (
            <BannerForm
              banner={editing}
              isPending={updateBanner.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload, image) =>
                updateBanner.mutate({ id: editing._id, payload, image }, { onSuccess: () => setEditing(null) })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({
  banner,
  isPending,
  onCancel,
  onSubmit,
}: {
  banner?: any;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (payload: any, image?: File) => void;
}) {
  const [title, setTitle] = useState(banner?.title || "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle || "");
  const [redirectType, setRedirectType] = useState(banner?.redirectType || "external");
  const [redirectId, setRedirectId] = useState(banner?.redirectId || "");
  const [externalUrl, setExternalUrl] = useState(banner?.externalUrl || "");
  const [placement, setPlacement] = useState(banner?.placement || "home_top");
  const [priority, setPriority] = useState(String(banner?.priority ?? 0));
  const [startDate, setStartDate] = useState(banner?.startDate ? String(banner.startDate).slice(0, 10) : "");
  const [endDate, setEndDate] = useState(banner?.endDate ? String(banner.endDate).slice(0, 10) : "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [image, setImage] = useState<File | undefined>();
  const [searchEntity, setSearchEntity] = useState("");

  const categoriesQuery = useAdminCategories({ page: 1, limit: 200, sortBy: "title", sortOrder: "asc" });
  const productsQuery = useAdminProducts({ page: 1, limit: 200, sortBy: "title", sortOrder: "asc" });

  const categories = categoriesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];

  const filteredCategories = categories.filter((c: any) =>
    c.title?.toLowerCase().includes(searchEntity.toLowerCase())
  );
  const filteredProducts = products.filter((p: any) =>
    p.title?.toLowerCase().includes(searchEntity.toLowerCase())
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: any = {
      title: title || undefined,
      subtitle: subtitle || undefined,
      redirectType,
      placement,
      priority: Number(priority || 0),
      isActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    if (redirectType === "external") {
      payload.externalUrl = externalUrl || undefined;
    } else {
      payload.redirectId = redirectId || undefined;
    }
    onSubmit(payload, image);
  };

  return (
    <form onSubmit={submit} className="grid gap-3 pt-2">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Summer Sale" />
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">Subtitle</span>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} placeholder="Get up to 50% off" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-500">Redirect Type</span>
          <select
            value={redirectType}
            onChange={(e) => {
              setRedirectType(e.target.value);
              setRedirectId("");
              setSearchEntity("");
            }}
            className={selectClass}
          >
            <option value="external">External Link</option>
            <option value="product">Product Details</option>
            <option value="category">Category List</option>
            <option value="collection">Collection List</option>
          </select>
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-500">Placement Slot</span>
          <select value={placement} onChange={(e) => setPlacement(e.target.value)} className={selectClass}>
            <option value="home_top">Home Top Banner</option>
            <option value="home_middle">Home Middle Banner</option>
            <option value="category">Category Banner</option>
          </select>
        </div>
      </div>

      {redirectType === "external" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-gray-400">External URL</span>
            <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputClass} placeholder="https://example.com" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-gray-400">Priority Number</span>
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} placeholder="0" />
          </div>
        </div>
      ) : redirectType === "collection" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-gray-400">Collection ID</span>
            <Input value={redirectId} onChange={(e) => setRedirectId(e.target.value)} className={inputClass} placeholder="Enter collection ID" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-gray-400">Priority Number</span>
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} placeholder="0" />
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-400">
                {redirectType === "category" ? "Select Category" : "Select Product"}
              </span>
              <Input
                value={searchEntity}
                onChange={(e) => setSearchEntity(e.target.value)}
                className={inputClass}
                placeholder="Search..."
              />
            </div>
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-400">Priority Number</span>
              <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} placeholder="0" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-2">
            {redirectType === "category" && (categoriesQuery.isLoading ? (
              <div className="py-4 text-center text-sm text-gray-500">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No categories found</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredCategories.map((cat: any) => (
                  <button
                    type="button"
                    key={cat._id}
                    onClick={() => setRedirectId(redirectId === cat._id ? "" : cat._id)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                      redirectId === cat._id
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                        : "border-transparent bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {cat.image && (
                      <img src={cat.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                    )}
                    <span className="line-clamp-2">{cat.title}</span>
                  </button>
                ))}
              </div>
            ))}
            {redirectType === "product" && (productsQuery.isLoading ? (
              <div className="py-4 text-center text-sm text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No products found</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredProducts.map((prod: any) => (
                  <button
                    type="button"
                    key={prod._id}
                    onClick={() => setRedirectId(redirectId === prod._id ? "" : prod._id)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                      redirectId === prod._id
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                        : "border-transparent bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {prod.images?.[0]?.url && (
                      <img src={prod.images[0].url} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                    )}
                    <span className="line-clamp-2">{prod.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">Start Date</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">End Date</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase text-gray-400">Image Asset</span>
        <Input
          type="file"
          accept="image/*"
          className="border-white/10 bg-white/5 text-white"
          required={!banner}
          onChange={(e) => setImage(e.target.files?.[0])}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-300">
        <div className="grid gap-0.5">
          <div className="font-medium">Active Status</div>
          <div className="text-xs text-gray-500">Enable or disable banner visibility in the client app.</div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save Banner
        </Button>
      </DialogFooter>
    </form>
  );
}
