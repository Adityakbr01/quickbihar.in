import React, { useState, FormEvent } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  AdminCoupon,
  CouponDiscountType,
  CouponPayload,
  QueryParams,
} from "../../api/catalogManagement.api";
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "../../hooks/useCatalogManagement";
import {
  inputClass,
  selectClass,
  formatDate,
  formatAmount,
  isExpired,
  dateInputValue,
  numericOrUndefined,
} from "../../utils";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared/TableHelpers";

export function CouponManagementPanel() {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const couponsQuery = useAdminCoupons(params);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const coupons = couponsQuery.data?.data || [];

  const setParam = (
    key: keyof QueryParams,
    value: QueryParams[keyof QueryParams],
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Coupon Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "expired", label: "Expired" },
        ]}
        onStatus={(value) =>
          setParam("status", value === "all" ? undefined : value)
        }
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created" },
          { value: "code", label: "Code" },
          { value: "discountValue", label: "Discount" },
          { value: "endDate", label: "Expiry" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => couponsQuery.refetch()}
        extraAction={
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create Coupon
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {couponsQuery.isLoading && (
            <LoadingState label="Loading coupons..." />
          )}
          {!couponsQuery.isLoading && !coupons.length && (
            <EmptyState label="No coupons found." />
          )}
          {!couponsQuery.isLoading && Boolean(coupons.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Code</TableHead>
                  <TableHead className="text-gray-400">Discount</TableHead>
                  <TableHead className="text-gray-400">Usage</TableHead>
                  <TableHead className="text-gray-400">Dates</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow
                    key={coupon._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {coupon.code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : `Rs. ${formatAmount(coupon.discountValue)}`}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {coupon.usedCount || 0} / {coupon.usageLimit}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-400">
                        {formatDate(coupon.startDate)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(coupon.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          updateCoupon.mutate({
                            couponId: coupon._id,
                            payload: { isActive: !coupon.isActive },
                          })
                        }
                        disabled={updateCoupon.isPending}
                        className="rounded-full text-left transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <StatusBadge
                          active={coupon.isActive && !isExpired(coupon.endDate)}
                          label={
                            coupon.isActive
                              ? isExpired(coupon.endDate)
                                ? "Expired"
                                : "Active"
                              : "Inactive"
                          }
                        />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => setEditing(coupon)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete coupon ${coupon.code}?`))
                              deleteCoupon.mutate(coupon._id);
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
      <PaginationFooter
        page={params.page || 1}
        totalPages={couponsQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />
      <CouponCreateDialog
        open={creating}
        isPending={createCoupon.isPending}
        onOpenChange={setCreating}
        onSubmit={(payload) => {
          createCoupon.mutate(payload, { onSuccess: () => setCreating(false) });
        }}
      />
      <CouponEditDialog
        coupon={editing}
        isPending={updateCoupon.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(payload) => {
          if (!editing) return;
          updateCoupon.mutate(
            { couponId: editing._id, payload },
            { onSuccess: () => setEditing(null) },
          );
        }}
      />
    </div>
  );
}

function CouponCreateDialog({
  open,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CouponPayload) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
        </DialogHeader>
        <CouponForm
          key={open ? "create-coupon-open" : "create-coupon-closed"}
          coupon={null}
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function CouponEditDialog({
  coupon,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  coupon: AdminCoupon | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CouponPayload) => void;
}) {
  return (
    <Dialog open={Boolean(coupon)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Coupon {coupon?.code}</DialogTitle>
        </DialogHeader>
        {coupon && (
          <CouponForm
            key={coupon._id}
            coupon={coupon}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CouponForm({
  coupon,
  onSubmit,
  onCancel,
  isPending,
}: {
  coupon: AdminCoupon | null;
  onSubmit: (payload: CouponPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [code, setCode] = useState(coupon?.code || "");
  const [description, setDescription] = useState(coupon?.description || "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discountType || "PERCENTAGE",
  );
  const [discountValue, setDiscountValue] = useState(
    String(coupon?.discountValue ?? ""),
  );
  const [minOrderValue, setMinOrderValue] = useState(
    String(coupon?.minOrderValue ?? ""),
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    String(coupon?.maxDiscountAmount ?? ""),
  );
  const [usageLimit, setUsageLimit] = useState(
    String(coupon?.usageLimit ?? ""),
  );
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(
    String(coupon?.usageLimitPerUser ?? ""),
  );
  const [startDate, setStartDate] = useState(dateInputValue(coupon?.startDate));
  const [endDate, setEndDate] = useState(dateInputValue(coupon?.endDate));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [dateError, setDateError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!endDate) {
      setDateError("End date is required.");
      return;
    }

    setDateError("");
    onSubmit({
      code,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: numericOrUndefined(minOrderValue),
      maxDiscountAmount: numericOrUndefined(maxDiscountAmount),
      usageLimit: numericOrUndefined(usageLimit),
      usageLimitPerUser: numericOrUndefined(usageLimitPerUser),
      startDate: startDate || undefined,
      endDate,
      isActive,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
      <Input
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="Coupon Code"
        required
        className={inputClass}
      />
      <select
        value={discountType}
        onChange={(event) =>
          setDiscountType(event.target.value as CouponDiscountType)
        }
        className={selectClass}
      >
        <option value="PERCENTAGE">Percentage</option>
        <option value="FIXED">Fixed Amount</option>
      </select>
      <Input
        value={discountValue}
        onChange={(event) => setDiscountValue(event.target.value)}
        placeholder="Discount Value"
        type="number"
        min="0"
        required
        className={inputClass}
      />
      <Input
        value={minOrderValue}
        onChange={(event) => setMinOrderValue(event.target.value)}
        placeholder="Minimum Order"
        type="number"
        min="0"
        className={inputClass}
      />
      <Input
        value={maxDiscountAmount}
        onChange={(event) => setMaxDiscountAmount(event.target.value)}
        placeholder="Maximum Discount"
        type="number"
        min="0"
        className={inputClass}
      />
      <Input
        value={usageLimit}
        onChange={(event) => setUsageLimit(event.target.value)}
        placeholder="Usage Limit"
        type="number"
        min="1"
        className={inputClass}
      />
      <Input
        value={usageLimitPerUser}
        onChange={(event) => setUsageLimitPerUser(event.target.value)}
        placeholder="Per User Limit"
        type="number"
        min="1"
        className={inputClass}
      />
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
        <span>Active Status</span>
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
      <DatePicker
        value={startDate}
        onChange={setStartDate}
        placeholder="Start Date"
        className={inputClass}
      />
      <DatePicker
        value={endDate}
        onChange={(value) => {
          setEndDate(value);
          if (value) setDateError("");
        }}
        placeholder="End Date"
        required
        className={inputClass}
      />
      {dateError && (
        <div className="text-xs text-red-300 md:col-span-2">{dateError}</div>
      )}
      <div className="md:col-span-2">
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          required
          className={inputClass}
        />
      </div>
      <div className="flex gap-2 md:col-span-4">
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          {coupon ? "Save Coupon" : "Create Coupon"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
