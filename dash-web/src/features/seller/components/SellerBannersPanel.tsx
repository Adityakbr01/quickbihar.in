import React, { type FormEvent, type ReactNode, useState } from "react";
import { Plus, Save, Send, Loader2 } from "lucide-react";
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
  useSellerCategories,
  useSellerProducts,
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
          isPending={mutations.create.isPending}
          onSubmit={(payload, image, onSuccess) =>
            mutations.create.mutate({ payload, image }, { onSuccess })
          }
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
              isPending={mutations.update.isPending}
              onSubmit={(payload, image, onSuccess) =>
                mutations.update.mutate({ bannerId: banner._id, payload, image }, { onSuccess })
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
  isPending = false,
  onSubmit,
}: {
  banner?: SellerBanner;
  trigger: ReactNode;
  isPending?: boolean;
  onSubmit: (payload: SellerBannerPayload, image: File | undefined, onSuccess: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [redirectType, setRedirectType] = useState<"external" | "product" | "category" | "collection">(
    banner?.redirectType || "external"
  );
  const [redirectId, setRedirectId] = useState(banner?.redirectId || "");
  const [externalUrl, setExternalUrl] = useState(banner?.externalUrl || "");

  const categoriesQuery = useSellerCategories();
  const productsQuery = useSellerProducts({ page: 1, limit: 100 });

  const categories = categoriesQuery.data?.available || [];
  const products = productsQuery.data?.data || [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setRedirectType(banner?.redirectType || "external");
      setRedirectId(banner?.redirectId || "");
      setExternalUrl(banner?.externalUrl || "");
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: SellerBannerPayload = {
      title: text(form, "title"),
      subtitle: text(form, "subtitle"),
      redirectType,
      redirectId: redirectType !== "external" ? redirectId || undefined : undefined,
      externalUrl: redirectType === "external" ? externalUrl || text(form, "externalUrl") : undefined,
      placement: text(form, "placement") as "home_top" | "home_middle" | "category",
      priority: numberValue(form, "priority") || 0,
    };

    onSubmit(payload, files(form, "image")[0], () => {
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              Redirect Type
              <select
                name="redirectType"
                value={redirectType}
                onChange={(e) => {
                  setRedirectType(e.target.value as any);
                  setRedirectId("");
                }}
                className={selectClass}
              >
                <option value="external">External Link</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="collection">Collection</option>
              </select>
            </label>
            <label className={labelClass}>
              Placement Slot
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
          </div>

          {/* Conditional Redirect Options */}
          {redirectType === "external" && (
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-500">External URL</span>
              <Input
                name="externalUrl"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
                required
              />
            </div>
          )}

          {redirectType === "product" && (
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-500">Select Product</span>
              <select
                value={redirectId}
                onChange={(e) => setRedirectId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} (Rs. {p.price})
                  </option>
                ))}
              </select>
            </div>
          )}

          {redirectType === "category" && (
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-500">Select Category</span>
              <select
                value={redirectId}
                onChange={(e) => setRedirectId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Choose a category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {redirectType === "collection" && (
            <div className="grid gap-1">
              <span className="text-xs font-medium uppercase text-gray-500">Collection ID / Name</span>
              <Input
                value={redirectId}
                onChange={(e) => setRedirectId(e.target.value)}
                placeholder="e.g. summer-collection"
                className={inputClass}
                required
              />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Field name="priority" label="Priority Number" type="number" defaultValue={banner?.priority || 0} />
            <label className={labelClass}>
              Image Asset
              <Input
                name="image"
                type="file"
                accept="image/*"
                className={inputClass}
                required={!banner}
              />
            </label>
          </div>

          <DialogFooter className="border-white/10 bg-white/[0.03] gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {banner ? "Save Changes" : "Save Draft"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
