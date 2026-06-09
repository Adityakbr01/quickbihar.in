"use client";

import React, { type FormEvent, type ReactNode, useState } from "react";
import { Plus, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  SellerQueryParams,
  SellerBanner,
  SellerBannerPayload,
} from "@/features/seller/api/sellerManagement.api";
import {
  useSellerBanners,
  useSellerBannerMutations,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  RowActions,
  DeleteButton,
  PaginationBar,
  Field,
  inputClass,
  selectClass,
  labelClass,
  text,
  numberValue,
  files,
} from "./SellerHelpers";

export function SellerBannersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const bannersQuery = useSellerBanners(params);
  const mutations = useSellerBannerMutations();

  return (
    <ModuleCard
      title="Banners"
      actions={
        <BannerDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          }
          onSubmit={(payload, image) => mutations.create.mutate({ payload, image })}
        />
      }
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      <SimpleTable
        empty={bannersQuery.isLoading ? "Loading banners..." : "No banners found."}
        columns={["Banner", "Placement", "Priority", "Approval", "Actions"]}
        rows={(bannersQuery.data?.data || []).map((banner) => [
          <div key={`${banner._id}-banner`} className="flex min-w-56 items-center gap-3">
            <img src={banner.image} alt={banner.title || "Banner"} className="h-10 w-16 rounded object-cover" />
            <div>
              <div className="font-medium text-white">{banner.title || "Banner"}</div>
              <div className="text-xs text-gray-500">{banner.subtitle || banner.externalUrl || "-"}</div>
            </div>
          </div>,
          banner.placement || "home_top",
          banner.priority || 0,
          <StatusBadge key={`${banner._id}-status`} label={banner.approvalStatus || "APPROVED"} />,
          <RowActions key={`${banner._id}-actions`}>
            <BannerDialog
              banner={banner}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Edit
                </Button>
              }
              onSubmit={(payload, image) =>
                mutations.update.mutate({ bannerId: banner._id, payload, image })
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
              onClick={() => mutations.submit.mutate(banner._id)}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <DeleteButton onDelete={() => mutations.remove.mutate(banner._id)} />
          </RowActions>,
        ])}
      />
      <PaginationBar result={bannersQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function BannerDialog({
  banner,
  trigger,
  onSubmit,
}: {
  banner?: SellerBanner;
  trigger: ReactNode;
  onSubmit: (payload: SellerBannerPayload, image?: File) => void;
}) {
  const [open, setOpen] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(
      {
        title: text(form, "title"),
        subtitle: text(form, "subtitle"),
        redirectType: text(form, "redirectType") as "product" | "category" | "collection" | "external",
        externalUrl: text(form, "externalUrl"),
        placement: text(form, "placement") as "home_top" | "home_middle" | "category",
        priority: numberValue(form, "priority"),
      },
      files(form, "image")[0]
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Create Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="title" label="Title" defaultValue={banner?.title} />
            <Field name="subtitle" label="Subtitle" defaultValue={banner?.subtitle} />
            <label className={labelClass}>
              Redirect
              <select
                name="redirectType"
                defaultValue={banner?.redirectType || "external"}
                className={selectClass}
              >
                <option value="external">External</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="collection">Collection</option>
              </select>
            </label>
            <label className={labelClass}>
              Placement
              <select
                name="placement"
                defaultValue={banner?.placement || "home_top"}
                className={selectClass}
              >
                <option value="home_top">Home Top</option>
                <option value="home_middle">Home Middle</option>
                <option value="category">Category</option>
              </select>
            </label>
            <Field name="externalUrl" label="External URL" defaultValue={banner?.externalUrl} />
            <Field name="priority" label="Priority" type="number" defaultValue={banner?.priority || 0} />
          </div>
          <label className={labelClass}>
            Image
            <Input
              name="image"
              type="file"
              accept="image/*"
              className={inputClass}
              required={!banner}
            />
          </label>
          <DialogFooter className="border-white/10 bg-white/[0.03] gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
