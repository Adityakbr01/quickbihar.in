import React, { type FormEvent, type ReactNode, useState } from "react";
import { Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
  SellerCoupon,
  SellerCouponPayload,
} from "@/features/seller/api/sellerManagement.api";
import {
  useSellerCoupons,
  useSellerCouponMutations,
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
  formatAmount,
  formatDate,
  text,
  numberValue,
  dateInput,
} from "./SellerHelpers";

export function SellerCouponsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const couponsQuery = useSellerCoupons(params);
  const mutations = useSellerCouponMutations();

  return (
    <ModuleCard
      title="Coupons"
      actions={
        <CouponDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          }
          isPending={mutations.create.isPending}
          onSubmit={(payload, onSuccess) => mutations.create.mutate(payload, { onSuccess })}
        />
      }
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      <SimpleTable
        empty={couponsQuery.isLoading ? "Loading coupons..." : "No coupons found."}
        columns={["Code", "Rule", "Target", "In Cart?", "Usage", "Dates", "Approval", "Actions"]}
        rows={(couponsQuery.data?.data || []).map((coupon) => [
          <div key={`${coupon._id}-code`} className="font-medium text-foreground">
            {coupon.code}
          </div>,
          `${
            coupon.discountType === "PERCENTAGE"
              ? `${coupon.discountValue}%`
              : `Rs. ${formatAmount(coupon.discountValue)}`
          } off`,
          coupon.appliesTo === "SPECIFIC" ? "Specific Products" : "All Products",
          <button
            key={`${coupon._id}-showOnCart`}
            type="button"
            disabled={mutations.update.isPending}
            onClick={() => {
              const nextVal = !(coupon.showOnCart ?? true);
              mutations.update.mutate({
                couponId: coupon._id,
                payload: {
                  code: coupon.code,
                  description: coupon.description,
                  discountType: coupon.discountType,
                  discountValue: coupon.discountValue,
                  minOrderValue: coupon.minOrderValue,
                  maxDiscountAmount: coupon.maxDiscountAmount,
                  usageLimit: coupon.usageLimit,
                  usageLimitPerUser: coupon.usageLimitPerUser,
                  startDate: coupon.startDate,
                  endDate: coupon.endDate,
                  appliesTo: coupon.appliesTo,
                  productIds: coupon.productIds,
                  showOnCart: nextVal,
                },
              });
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
              coupon.showOnCart !== false
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-muted border-border text-muted-foreground hover:bg-zinc-500/20"
            }`}
            title="Click to toggle whether this coupon appears in customer cart"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                coupon.showOnCart !== false ? "bg-emerald-400" : "bg-zinc-400"
              }`}
            />
            {coupon.showOnCart !== false ? "Visible" : "Hidden"}
          </button>,
          `${coupon.usedCount}/${coupon.usageLimit}`,
          `${formatDate(coupon.startDate)} - ${formatDate(coupon.endDate)}`,
          <StatusBadge key={`${coupon._id}-status`} label={coupon.approvalStatus || "APPROVED"} />,
          <RowActions key={`${coupon._id}-actions`}>
            <CouponDialog
              coupon={coupon}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border bg-muted text-foreground hover:bg-muted"
                >
                  Edit
                </Button>
              }
              isPending={mutations.update.isPending}
              onSubmit={(payload, onSuccess) =>
                mutations.update.mutate({ couponId: coupon._id, payload }, { onSuccess })
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
              onClick={() => mutations.submit.mutate(coupon._id)}
            >
              Send
            </Button>
            <DeleteButton onDelete={() => mutations.remove.mutate(coupon._id)} />
          </RowActions>,
        ])}
      />
      <PaginationBar result={couponsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function CouponDialog({
  coupon,
  trigger,
  isPending = false,
  onSubmit,
}: {
  coupon?: SellerCoupon;
  trigger: ReactNode;
  isPending?: boolean;
  onSubmit: (payload: SellerCouponPayload, onSuccess: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(dateInput(coupon?.startDate));
  const [endDate, setEndDate] = useState(dateInput(coupon?.endDate));
  const [dateError, setDateError] = useState("");
  const [appliesTo, setAppliesTo] = useState<"ALL" | "SPECIFIC">(coupon?.appliesTo || "ALL");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(coupon?.productIds || []);
  const [showOnCart, setShowOnCart] = useState<boolean>(coupon?.showOnCart ?? true);

  const productsQuery = useSellerProducts({ page: 1, limit: 100 });
  const products = productsQuery.data?.data || [];

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setDateError("");
    if (nextOpen) {
      setStartDate(dateInput(coupon?.startDate));
      setEndDate(dateInput(coupon?.endDate));
      setAppliesTo(coupon?.appliesTo || "ALL");
      setSelectedProductIds(coupon?.productIds || []);
      setShowOnCart(coupon?.showOnCart ?? true);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!endDate) {
      setDateError("End date is required.");
      return;
    }
    if (appliesTo === "SPECIFIC" && selectedProductIds.length === 0) {
      setDateError("At least one product must be selected for specific coupons.");
      return;
    }

    onSubmit(
      {
        code: text(form, "code"),
        description: text(form, "description"),
        discountType: text(form, "discountType") as "PERCENTAGE" | "FIXED",
        discountValue: numberValue(form, "discountValue") || 0,
        minOrderValue: numberValue(form, "minOrderValue"),
        maxDiscountAmount: numberValue(form, "maxDiscountAmount"),
        usageLimit: numberValue(form, "usageLimit"),
        usageLimitPerUser: numberValue(form, "usageLimitPerUser"),
        startDate,
        endDate,
        showOnCart,
        appliesTo,
        productIds: appliesTo === "SPECIFIC" ? selectedProductIds : [],
      },
      () => changeOpen(false)
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="border-border bg-card text-foreground sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="code" label="Code" defaultValue={coupon?.code} required />
            <label className={labelClass}>
              Type
              <select
                name="discountType"
                defaultValue={coupon?.discountType || "PERCENTAGE"}
                className={selectClass}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </label>
            <Field name="discountValue" label="Discount Value" type="number" defaultValue={coupon?.discountValue} required />
            <Field name="minOrderValue" label="Minimum Order" type="number" defaultValue={coupon?.minOrderValue} />
            <Field name="maxDiscountAmount" label="Maximum Discount" type="number" defaultValue={coupon?.maxDiscountAmount} />
            <Field name="usageLimit" label="Usage Limit" type="number" defaultValue={coupon?.usageLimit || 100} />
            <Field name="usageLimitPerUser" label="Per User Limit" type="number" defaultValue={coupon?.usageLimitPerUser || 1} />
            <label className={labelClass}>
              Start Date
              <DatePicker
                name="startDate"
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              End Date
              <DatePicker
                name="endDate"
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  if (value) setDateError("");
                }}
                placeholder="End Date"
                required
                className={inputClass}
              />
            </label>
            <Field name="description" label="Description" defaultValue={coupon?.description} required />

            <div className="grid gap-2 md:col-span-2 rounded-lg border border-border bg-muted p-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-foreground block">Show Coupon in Customer Cart</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    When enabled, this coupon is shown under "Offers & Benefits" in customer carts for 1-tap application.
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="showOnCart"
                  checked={showOnCart}
                  onChange={(e) => setShowOnCart(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-muted border-border ml-3"
                />
              </label>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <span className={labelClass}>Coupon Target</span>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="appliesTo"
                    value="ALL"
                    checked={appliesTo === "ALL"}
                    onChange={() => setAppliesTo("ALL")}
                    className="text-primary focus:ring-0 focus:ring-offset-0 bg-muted border-border"
                  />
                  Apply to all my products
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="appliesTo"
                    value="SPECIFIC"
                    checked={appliesTo === "SPECIFIC"}
                    onChange={() => setAppliesTo("SPECIFIC")}
                    className="text-primary focus:ring-0 focus:ring-offset-0 bg-muted border-border"
                  />
                  Apply to specific products
                </label>
              </div>
            </div>

            {appliesTo === "SPECIFIC" && (
              <div className="grid gap-2 md:col-span-2">
                <span className={labelClass}>Select Products</span>
                <div className="max-h-48 overflow-y-auto border border-border rounded-md bg-muted p-2 space-y-1">
                  {products.map((product) => {
                    const isChecked = selectedProductIds.includes(product._id);
                    return (
                      <label
                        key={product._id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer text-sm text-muted-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedProductIds(selectedProductIds.filter((id) => id !== product._id));
                            } else {
                              setSelectedProductIds([...selectedProductIds, product._id]);
                            }
                          }}
                          className="rounded text-primary focus:ring-0 focus:ring-offset-0 bg-muted border-border"
                        />
                        {product.images?.[0]?.url && (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 truncate">
                          <span className="font-medium">{product.title}</span>
                          <span className="block text-xs text-muted-foreground">SKU: {product.details?.sku || "N/A"}</span>
                        </div>
                      </label>
                    );
                  })}
                  {products.length === 0 && !productsQuery.isLoading && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No products found. Please create products first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {dateError && <div className="text-xs text-red-300 md:col-span-2">{dateError}</div>}
          </div>
          <DialogFooter className="border-border bg-muted gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => changeOpen(false)}
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
                  {coupon ? "Save Changes" : "Save Draft"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
