"use client";

import React, { type FormEvent, useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
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
} from "../../hooks/useCatalogManagement";
import {
  ManagementToolbar,
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared/TableHelpers";
import { selectClass, inputClass, formatDate } from "../../utils";

export function BannerManagementPanel() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const bannersQuery = useAdminBanners();
  const createBanner = useCreateAdminBanner();
  const updateBanner = useUpdateAdminBanner();
  const deleteBanner = useDeleteAdminBanner();

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
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Updated</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBanners.map((banner) => (
                  <TableRow key={banner._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <img src={banner.image} alt={banner.title || "Banner"} className="h-10 w-16 rounded object-cover" />
                        <div>
                          <div className="font-medium text-white">{banner.title || "Untitled Banner"}</div>
                          <div className="text-xs text-gray-500">{banner.subtitle || banner.externalUrl || "-"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-400/30 text-cyan-300">
                        {banner.placement}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-300">{banner.priority || 0}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          updateBanner.mutate({ id: banner._id, payload: { isActive: !banner.isActive } })
                        }
                      >
                        <StatusBadge active={Boolean(banner.isActive)} label={banner.isActive ? "Active" : "Inactive"} />
                      </button>
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
  const [externalUrl, setExternalUrl] = useState(banner?.externalUrl || "");
  const [placement, setPlacement] = useState(banner?.placement || "home_top");
  const [priority, setPriority] = useState(String(banner?.priority || 0));
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [image, setImage] = useState<File | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(
      {
        title: title || undefined,
        subtitle: subtitle || undefined,
        redirectType,
        externalUrl: externalUrl || undefined,
        placement,
        priority: Number(priority || 0),
        isActive,
      },
      image
    );
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
          <select value={redirectType} onChange={(e) => setRedirectType(e.target.value)} className={selectClass}>
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

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">Redirect Value / URL</span>
          <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputClass} placeholder="https://example.com or ID" />
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-400">Priority Number</span>
          <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} placeholder="0" />
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
