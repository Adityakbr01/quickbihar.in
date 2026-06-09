"use client";

import React, { type FormEvent, type ReactNode, useState } from "react";
import { Plus, Save } from "lucide-react";
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
          onSubmit={(payload) => mutations.create.mutate(payload)}
        />
      }
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      <SimpleTable
        empty={couponsQuery.isLoading ? "Loading coupons..." : "No coupons found."}
        columns={["Code", "Rule", "Usage", "Dates", "Approval", "Actions"]}
        rows={(couponsQuery.data?.data || []).map((coupon) => [
          <div key={`${coupon._id}-code`} className="font-medium text-white">
            {coupon.code}
          </div>,
          `${
            coupon.discountType === "PERCENTAGE"
              ? `${coupon.discountValue}%`
              : `Rs. ${formatAmount(coupon.discountValue)}`
          } off`,
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
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Edit
                </Button>
              }
              onSubmit={(payload) => mutations.update.mutate({ couponId: coupon._id, payload })}
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
  onSubmit,
}: {
  coupon?: SellerCoupon;
  trigger: ReactNode;
  onSubmit: (payload: SellerCouponPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(dateInput(coupon?.startDate));
  const [endDate, setEndDate] = useState(dateInput(coupon?.endDate));
  const [dateError, setDateError] = useState("");

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setDateError("");
    if (nextOpen) {
      setStartDate(dateInput(coupon?.startDate));
      setEndDate(dateInput(coupon?.endDate));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!endDate) {
      setDateError("End date is required.");
      return;
    }

    onSubmit({
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
    });
    changeOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
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
            {dateError && <div className="text-xs text-red-300 md:col-span-2">{dateError}</div>}
            <Field name="description" label="Description" defaultValue={coupon?.description} required />
          </div>
          <DialogFooter className="border-white/10 bg-white/[0.03] gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>
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
