"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit,
  Eye,
  FileDown,
  Package,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  XCircle,
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
import { ManagedPerson } from "../api/adminManagement.api";
import {
  AdminCategory,
  AdminCoupon,
  AdminOrder,
  AdminProduct,
  CategoryPayload,
  CouponDiscountType,
  CouponPayload,
  OrderStatus,
  ProductPayload,
  ProductVariantPayload,
  QueryParams,
} from "../api/catalogManagement.api";
import {
  useAdminCategories,
  useAdminCoupons,
  useAdminOrders,
  useAdminProducts,
  useCreateCatalogProduct,
  useCreateCategory,
  useCreateCoupon,
  useDeleteCatalogProduct,
  useDeleteCategory,
  useDeleteCoupon,
  useUpdateCatalogProduct,
  useUpdateCategory,
  useUpdateCoupon,
  useUpdateOrderStatus,
} from "../hooks/useCatalogManagement";

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
const textareaClass = "min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";

const orderStatuses: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
];

const editableOrderStatuses = orderStatuses.filter((item) => item.value !== "ALL") as Array<{ value: OrderStatus; label: string }>;

export function OrderManagementPanel() {
  const [params, setParams] = useState<QueryParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const ordersQuery = useAdminOrders(params);
  const updateOrderStatus = useUpdateOrderStatus();
  const orders = ordersQuery.data?.data || [];

  const setParam = (key: keyof QueryParams, value: QueryParams[keyof QueryParams]) => {
    setParams((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  };

  const exportOrders = () => {
    const rows = [
      ["Order ID", "Customer", "Phone", "Status", "Amount", "Items", "Created At"],
      ...orders.map((order) => [
        order.orderId,
        order.shippingAddress?.fullName || order.userId?.fullName || "",
        order.shippingAddress?.phone || order.userId?.phone || "",
        order.status,
        String(order.payableAmount || 0),
        String(order.items?.length || 0),
        order.createdAt || "",
      ]),
    ];
    downloadCsv("orders.csv", rows);
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Order Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "ALL"}
        statuses={orderStatuses}
        onStatus={(value) => setParam("status", value)}
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created" },
          { value: "payableAmount", label: "Amount" },
          { value: "orderId", label: "Order ID" },
          { value: "status", label: "Status" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => ordersQuery.refetch()}
        extraAction={
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={exportOrders}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {ordersQuery.isLoading && <LoadingState label="Loading orders..." />}
          {!ordersQuery.isLoading && !orders.length && <EmptyState label="No orders found." />}
          {!ordersQuery.isLoading && Boolean(orders.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Order</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Products</TableHead>
                  <TableHead className="text-gray-400">Payment</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{order.orderId}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{order.shippingAddress?.fullName || order.userId?.fullName || "Customer"}</div>
                      <div className="text-xs text-gray-500">{order.shippingAddress?.phone || order.userId?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{order.items?.length || 0} items</div>
                      <div className="text-xs text-gray-500">{order.items?.[0]?.title || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-white">Rs. {formatAmount(order.payableAmount || 0)}</div>
                      <div className="text-xs text-gray-500">{order.paymentInfo?.razorpayPaymentId ? "Paid" : "Pending"}</div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={order.status}
                        className={selectClass}
                        onChange={(event) => updateOrderStatus.mutate({ orderId: order._id, status: event.target.value as OrderStatus })}
                        disabled={updateOrderStatus.isPending}
                      >
                        {editableOrderStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
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
      <PaginationFooter page={params.page || 1} totalPages={ordersQuery.data?.totalPages || 1} onPage={(page) => setParam("page", page)} />
      <OrderDetailsDialog order={selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} />
    </div>
  );
}

function OrderDetailsDialog({ order, onOpenChange }: { order: AdminOrder | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details {order?.orderId}</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <DetailTile title="Customer" lines={[order.shippingAddress.fullName, order.shippingAddress.phone, order.userId?.email]} />
              <DetailTile title="Payment" lines={[`Payable: Rs. ${formatAmount(order.payableAmount)}`, `Tax: Rs. ${formatAmount(order.totalTax || 0)}`, order.paymentInfo?.razorpayPaymentId || "Payment pending"]} />
              <DetailTile title="Shipping" lines={[order.shippingAddress.street, `${order.shippingAddress.city}, ${order.shippingAddress.state}`, order.shippingAddress.pincode]} />
            </div>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-base text-white">Ordered Products</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-4 text-gray-400">Product</TableHead>
                      <TableHead className="text-gray-400">Variant</TableHead>
                      <TableHead className="text-gray-400">Qty</TableHead>
                      <TableHead className="text-gray-400">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={`${item.productId}-${item.sku}`} className="border-white/10">
                        <TableCell className="px-4 text-white">{item.title}</TableCell>
                        <TableCell className="text-gray-300">{item.size} / {item.color} / {item.sku}</TableCell>
                        <TableCell className="text-gray-300">{item.quantity}</TableCell>
                        <TableCell className="text-white">Rs. {formatAmount(item.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CouponManagementPanel() {
  const [params, setParams] = useState<QueryParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const couponsQuery = useAdminCoupons(params);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const coupons = couponsQuery.data?.data || [];

  const setParam = (key: keyof QueryParams, value: QueryParams[keyof QueryParams]) => {
    setParams((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Coupon Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.isActive || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "expired", label: "Expired" },
        ]}
        onStatus={(value) => setParam("status", value)}
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
      />

      <CouponForm
        coupon={editing}
        isPending={createCoupon.isPending || updateCoupon.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(payload) => {
          if (editing) {
            updateCoupon.mutate({ couponId: editing._id, payload }, { onSuccess: () => setEditing(null) });
          } else {
            createCoupon.mutate(payload);
          }
        }}
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {couponsQuery.isLoading && <LoadingState label="Loading coupons..." />}
          {!couponsQuery.isLoading && !coupons.length && <EmptyState label="No coupons found." />}
          {!couponsQuery.isLoading && Boolean(coupons.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Code</TableHead>
                  <TableHead className="text-gray-400">Discount</TableHead>
                  <TableHead className="text-gray-400">Usage</TableHead>
                  <TableHead className="text-gray-400">Dates</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{coupon.code}</div>
                      <div className="text-xs text-gray-500">{coupon.description}</div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `Rs. ${formatAmount(coupon.discountValue)}`}
                    </TableCell>
                    <TableCell className="text-gray-300">{coupon.usedCount || 0} / {coupon.usageLimit}</TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-400">{formatDate(coupon.startDate)}</div>
                      <div className="text-xs text-gray-400">{formatDate(coupon.endDate)}</div>
                    </TableCell>
                    <TableCell><StatusBadge active={coupon.isActive && !isExpired(coupon.endDate)} label={coupon.isActive ? (isExpired(coupon.endDate) ? "Expired" : "Active") : "Inactive"} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setEditing(coupon)}>
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete coupon ${coupon.code}?`)) deleteCoupon.mutate(coupon._id);
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
      <PaginationFooter page={params.page || 1} totalPages={couponsQuery.data?.totalPages || 1} onPage={(page) => setParam("page", page)} />
    </div>
  );
}

function CouponForm({ coupon, onSubmit, onCancel, isPending }: { coupon: AdminCoupon | null; onSubmit: (payload: CouponPayload) => void; onCancel: () => void; isPending: boolean }) {
  const [code, setCode] = useState(coupon?.code || "");
  const [description, setDescription] = useState(coupon?.description || "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(coupon?.discountType || "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(String(coupon?.discountValue ?? ""));
  const [minOrderValue, setMinOrderValue] = useState(String(coupon?.minOrderValue ?? ""));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(String(coupon?.maxDiscountAmount ?? ""));
  const [usageLimit, setUsageLimit] = useState(String(coupon?.usageLimit ?? ""));
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(String(coupon?.usageLimitPerUser ?? ""));
  const [startDate, setStartDate] = useState(dateInputValue(coupon?.startDate));
  const [endDate, setEndDate] = useState(dateInputValue(coupon?.endDate));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  const submit = (event: FormEvent) => {
    event.preventDefault();
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
    <Card key={coupon?._id || "new"} className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">{coupon ? "Edit Coupon" : "Create Coupon"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
          <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Coupon Code" required className={inputClass} />
          <select value={discountType} onChange={(event) => setDiscountType(event.target.value as CouponDiscountType)} className={selectClass}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
          <Input value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="Discount Value" type="number" min="0" required className={inputClass} />
          <Input value={minOrderValue} onChange={(event) => setMinOrderValue(event.target.value)} placeholder="Minimum Order" type="number" min="0" className={inputClass} />
          <Input value={maxDiscountAmount} onChange={(event) => setMaxDiscountAmount(event.target.value)} placeholder="Maximum Discount" type="number" min="0" className={inputClass} />
          <Input value={usageLimit} onChange={(event) => setUsageLimit(event.target.value)} placeholder="Usage Limit" type="number" min="1" className={inputClass} />
          <Input value={usageLimitPerUser} onChange={(event) => setUsageLimitPerUser(event.target.value)} placeholder="Per User Limit" type="number" min="1" className={inputClass} />
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
          <Input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className={inputClass} />
          <Input value={endDate} onChange={(event) => setEndDate(event.target.value)} type="date" required className={inputClass} />
          <div className="md:col-span-2">
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" required className={inputClass} />
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {coupon ? "Save Coupon" : "Create Coupon"}
            </Button>
            {coupon && (
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProductManagementPanel({ sellers }: { sellers: ManagedPerson[] }) {
  const [params, setParams] = useState<QueryParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const productsQuery = useAdminProducts(params);
  const categoriesQuery = useAdminCategories({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const createProduct = useCreateCatalogProduct();
  const updateProduct = useUpdateCatalogProduct();
  const deleteProduct = useDeleteCatalogProduct();
  const products = productsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const setParam = (key: keyof QueryParams, value: QueryParams[keyof QueryParams]) => {
    setParams((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Product Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ]}
        onStatus={(value) => setParam("isActive", value === "all" ? undefined : value)}
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created" },
          { value: "price_low", label: "Price Low" },
          { value: "price_high", label: "Price High" },
          { value: "newest", label: "Newest" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => productsQuery.refetch()}
      />

      <ProductForm
        key={editing?._id || "new-product"}
        product={editing}
        sellers={sellers}
        categories={categories}
        isPending={createProduct.isPending || updateProduct.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(payload, images) => {
          if (editing) {
            updateProduct.mutate({ productId: editing._id, payload, images }, { onSuccess: () => setEditing(null) });
          } else {
            createProduct.mutate({ payload, images });
          }
        }}
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {productsQuery.isLoading && <LoadingState label="Loading products..." />}
          {!productsQuery.isLoading && !products.length && <EmptyState label="No products found." />}
          {!productsQuery.isLoading && Boolean(products.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Product</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Price</TableHead>
                  <TableHead className="text-gray-400">Stock</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{product.title}</div>
                      <div className="text-xs text-gray-500">{product.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{product.category}</div>
                      <div className="text-xs text-gray-500">{product.brand || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">Rs. {formatAmount(product.price)}</div>
                      {product.originalPrice && <div className="text-xs text-gray-500 line-through">Rs. {formatAmount(product.originalPrice)}</div>}
                    </TableCell>
                    <TableCell className="text-gray-300">{product.totalStock ?? product.variants?.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => updateProduct.mutate({ productId: product._id, payload: { isActive: !product.isActive } })}
                      >
                        <StatusBadge active={Boolean(product.isActive)} label={product.isActive ? "Active" : "Inactive"} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setEditing(product)}>
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete product ${product.title}?`)) deleteProduct.mutate(product._id);
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
      <PaginationFooter page={params.page || 1} totalPages={productsQuery.data?.totalPages || 1} onPage={(page) => setParam("page", page)} />
    </div>
  );
}

function ProductForm({ product, sellers, categories, onSubmit, onCancel, isPending }: { product: AdminProduct | null; sellers: ManagedPerson[]; categories: AdminCategory[]; onSubmit: (payload: ProductPayload, images: File[]) => void; onCancel: () => void; isPending: boolean }) {
  const [sellerId, setSellerId] = useState(product?.sellerId || sellers[0]?._id || "");
  const [title, setTitle] = useState(product?.title || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [category, setCategory] = useState(product?.category || categories[0]?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(String(product?.originalPrice ?? ""));
  const [sku, setSku] = useState(product?.details?.sku || "");
  const [tags, setTags] = useState((product?.tags || []).join(", "));
  const [isFeatured, setIsFeatured] = useState(Boolean(product?.isFeatured));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(product?.seo?.metaTitle || "");
  const [seoDescription, setSeoDescription] = useState(product?.seo?.metaDescription || "");
  const [seoKeywords, setSeoKeywords] = useState((product?.seo?.keywords || []).join(", "));
  const [images, setImages] = useState<File[]>([]);
  const [variants, setVariants] = useState<ProductVariantPayload[]>(product?.variants?.length ? product.variants : [{ size: "", color: "", price: undefined, stock: 0, sku: "" }]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(
      {
        sellerId: sellerId || undefined,
        title,
        brand: optionalValue(brand),
        category,
        description: optionalValue(description),
        shortDescription: optionalValue(shortDescription),
        price: Number(price),
        originalPrice: numericOrUndefined(originalPrice),
        details: { sku: optionalValue(sku) },
        tags: splitCsv(tags),
        variants: variants.map((variant) => ({
          ...variant,
          price: variant.price ? Number(variant.price) : undefined,
          stock: Number(variant.stock || 0),
        })),
        seo: {
          metaTitle: optionalValue(seoTitle),
          metaDescription: optionalValue(seoDescription),
          keywords: splitCsv(seoKeywords),
        },
        isFeatured,
        isActive,
      },
      images,
    );
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">{product ? "Edit Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <select value={sellerId} onChange={(event) => setSellerId(event.target.value)} required={!product} className={selectClass}>
              <option value="">Seller</option>
              {sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>{seller.sellerProfile?.businessName || seller.fullName}</option>
              ))}
            </select>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Product Name" required className={inputClass} />
            <Input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand" className={inputClass} />
            <select value={category} onChange={(event) => setCategory(event.target.value)} required className={selectClass}>
              <option value="">Category</option>
              {categories.map((item) => (
                <option key={item._id} value={item.title}>{item.title}</option>
              ))}
            </select>
            <Input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" type="number" min="0" required className={inputClass} />
            <Input value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} placeholder="Sale/Original Price" type="number" min="0" className={inputClass} />
            <Input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Product SKU" className={inputClass} />
            <Input type="file" accept="image/*" multiple required={!product} onChange={(event) => setImages(Array.from(event.target.files || []))} className={inputClass} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder="Short Description" className={textareaClass} />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className={textareaClass} />
          </div>
          <VariantEditor variants={variants} onChange={setVariants} />
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, comma separated" className={inputClass} />
            <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="SEO Meta Title" className={inputClass} />
            <Input value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} placeholder="SEO Keywords" className={inputClass} />
          </div>
          <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="SEO Meta Description" className={textareaClass} />
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
              Featured Product
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              Active
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending || (!product && !sellers.length)}>
              <Save className="h-4 w-4" />
              {product ? "Save Product" : "Create Product"}
            </Button>
            {product && <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function VariantEditor({ variants, onChange }: { variants: ProductVariantPayload[]; onChange: (variants: ProductVariantPayload[]) => void }) {
  const update = (index: number, key: keyof ProductVariantPayload, value: string) => {
    onChange(variants.map((variant, currentIndex) => currentIndex === index ? { ...variant, [key]: key === "stock" || key === "price" ? Number(value) : value } : variant));
  };

  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">Product Variants</div>
        <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onChange([...variants, { size: "", color: "", stock: 0, sku: "" }])}>
          <Plus className="h-3.5 w-3.5" />
          Add Variant
        </Button>
      </div>
      {variants.map((variant, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <Input value={variant.size} onChange={(event) => update(index, "size", event.target.value)} placeholder="Size" required className={inputClass} />
          <Input value={variant.color} onChange={(event) => update(index, "color", event.target.value)} placeholder="Color" required className={inputClass} />
          <Input value={variant.price ?? ""} onChange={(event) => update(index, "price", event.target.value)} placeholder="Variant Price" type="number" min="0" className={inputClass} />
          <Input value={variant.stock} onChange={(event) => update(index, "stock", event.target.value)} placeholder="Stock" type="number" min="0" required className={inputClass} />
          <Input value={variant.sku || ""} onChange={(event) => update(index, "sku", event.target.value)} placeholder="Variant SKU" className={inputClass} />
          <Button type="button" variant="ghost" className="text-red-300 hover:bg-red-400/10 hover:text-red-200" onClick={() => onChange(variants.filter((_, currentIndex) => currentIndex !== index))} disabled={variants.length === 1}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function CategoryManagementPanel() {
  const [params, setParams] = useState<QueryParams>({ page: 1, limit: 10, sortBy: "priority", sortOrder: "desc" });
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const categoriesQuery = useAdminCategories(params);
  const allCategoriesQuery = useAdminCategories({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const categories = categoriesQuery.data?.data || [];
  const allCategories = allCategoriesQuery.data?.data || [];

  const setParam = (key: keyof QueryParams, value: QueryParams[keyof QueryParams]) => {
    setParams((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Category Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        onStatus={(value) => setParam("status", value)}
        sortBy={params.sortBy || "priority"}
        sortOptions={[
          { value: "priority", label: "Priority" },
          { value: "sortOrder", label: "Sort Order" },
          { value: "title", label: "Name" },
          { value: "createdAt", label: "Created" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => categoriesQuery.refetch()}
      />

      <CategoryForm
        key={editing?._id || "new-category"}
        category={editing}
        categories={allCategories}
        isPending={createCategory.isPending || updateCategory.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(payload, image) => {
          if (editing) {
            updateCategory.mutate({ categoryId: editing._id, payload, image }, { onSuccess: () => setEditing(null) });
          } else if (image) {
            createCategory.mutate({ payload, image });
          }
        }}
      />

      <CategoryTree categories={allCategories} />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {categoriesQuery.isLoading && <LoadingState label="Loading categories..." />}
          {!categoriesQuery.isLoading && !categories.length && <EmptyState label="No categories found." />}
          {!categoriesQuery.isLoading && Boolean(categories.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Parent</TableHead>
                  <TableHead className="text-gray-400">Sort</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{category.title}</div>
                      <div className="text-xs text-gray-500">{category.slug}</div>
                    </TableCell>
                    <TableCell className="text-gray-300">{parentTitle(category.parentId)}</TableCell>
                    <TableCell className="text-gray-300">{category.priority || 0} / {category.sortOrder || 0}</TableCell>
                    <TableCell><StatusBadge active={Boolean(category.isActive)} label={category.isActive ? "Active" : "Inactive"} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setEditing(category)}>
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete category ${category.title}?`)) deleteCategory.mutate(category._id);
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
      <PaginationFooter page={params.page || 1} totalPages={categoriesQuery.data?.totalPages || 1} onPage={(page) => setParam("page", page)} />
    </div>
  );
}

function CategoryForm({ category, categories, onSubmit, onCancel, isPending }: { category: AdminCategory | null; categories: AdminCategory[]; onSubmit: (payload: CategoryPayload, image?: File) => void; onCancel: () => void; isPending: boolean }) {
  const [title, setTitle] = useState(category?.title || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState(parentIdValue(category?.parentId));
  const [priority, setPriority] = useState(String(category?.priority ?? ""));
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? ""));
  const [banner, setBanner] = useState(category?.banner || "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seo?.metaTitle || "");
  const [seoDescription, setSeoDescription] = useState(category?.seo?.metaDescription || "");
  const [seoKeywords, setSeoKeywords] = useState((category?.seo?.keywords || []).join(", "));
  const [image, setImage] = useState<File | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(
      {
        title,
        description: optionalValue(description),
        parentId: optionalValue(parentId),
        priority: numericOrUndefined(priority),
        sortOrder: numericOrUndefined(sortOrder),
        banner: optionalValue(banner),
        isActive,
        seo: {
          metaTitle: optionalValue(seoTitle),
          metaDescription: optionalValue(seoDescription),
          keywords: splitCsv(seoKeywords),
        },
      },
      image,
    );
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">{category ? "Edit Category" : "Create Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Category Name" required className={inputClass} />
          <select value={parentId} onChange={(event) => setParentId(event.target.value)} className={selectClass}>
            <option value="">No parent</option>
            {categories.filter((item) => item._id !== category?._id).map((item) => (
              <option key={item._id} value={item._id}>{item.title}</option>
            ))}
          </select>
          <Input value={priority} onChange={(event) => setPriority(event.target.value)} placeholder="Priority" type="number" className={inputClass} />
          <Input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="Sort Order" type="number" className={inputClass} />
          <Input type="file" accept="image/*" required={!category} onChange={(event) => setImage(event.target.files?.[0])} className={inputClass} />
          <Input value={banner} onChange={(event) => setBanner(event.target.value)} placeholder="Category Banner URL" className={inputClass} />
          <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="SEO Meta Title" className={inputClass} />
          <Input value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} placeholder="SEO Keywords" className={inputClass} />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className={textareaClass} />
          <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="SEO Meta Description" className={textareaClass} />
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending || (!category && !image)}>
              <Save className="h-4 w-4" />
              {category ? "Save Category" : "Create Category"}
            </Button>
            {category && <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CategoryTree({ categories }: { categories: AdminCategory[] }) {
  const roots = useMemo(() => categories.filter((category) => !parentIdValue(category.parentId)), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategory[]>();
    categories.forEach((category) => {
      const parent = parentIdValue(category.parentId);
      if (!parent) return;
      map.set(parent, [...(map.get(parent) || []), category]);
    });
    return map;
  }, [categories]);

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Category Tree View</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {!roots.length && <div className="text-sm text-gray-400">No categories available.</div>}
        {roots.map((category) => (
          <div key={category._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-white">{category.title}</div>
              <StatusBadge active={Boolean(category.isActive)} label={category.isActive ? "Active" : "Inactive"} />
            </div>
            <div className="mt-2 grid gap-1">
              {(childrenByParent.get(category._id) || []).map((child) => (
                <div key={child._id} className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-300">{child.title}</div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ManagementToolbar({
  title,
  search,
  onSearch,
  status,
  statuses,
  onStatus,
  sortBy,
  sortOptions,
  onSortBy,
  sortOrder,
  onSortOrder,
  onRefresh,
  extraAction,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  status: string;
  statuses: Array<{ value: string; label: string }>;
  onStatus: (value: string) => void;
  sortBy: string;
  sortOptions: Array<{ value: string; label: string }>;
  onSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrder: (value: "asc" | "desc") => void;
  onRefresh: () => void;
  extraAction?: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base text-white">{title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {extraAction}
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-[1fr_160px_160px_120px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search" className={`${inputClass} pl-8`} />
        </div>
        <select value={status} onChange={(event) => onStatus(event.target.value)} className={selectClass}>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(event) => onSortBy(event.target.value)} className={selectClass}>
          {sortOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select value={sortOrder} onChange={(event) => onSortOrder(event.target.value as "asc" | "desc")} className={selectClass}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </CardContent>
    </Card>
  );
}

function PaginationFooter({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1c1c1c] px-4 py-3">
      <div className="text-sm text-gray-400">Page {page} of {Math.max(totalPages, 1)}</div>
      <div className="flex gap-2">
        <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function DetailTile({ title, lines }: { title: string; lines: Array<string | undefined> }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 grid gap-1">
        {lines.filter(Boolean).map((line) => (
          <div key={line} className="text-sm text-gray-300">{line}</div>
        ))}
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-400">
      <Package className="h-4 w-4 animate-pulse" />
      {label}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-10 text-sm text-gray-400">{label}</div>;
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge variant="outline" className={active ? "border-emerald-400/30 text-emerald-300" : "border-red-400/30 text-red-300"}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function dateInputValue(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount || 0);
}

function numericOrUndefined(value: string) {
  if (value.trim() === "") return undefined;
  return Number(value);
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isExpired(value: string) {
  return new Date(value).getTime() < Date.now();
}

function parentIdValue(parent?: AdminCategory["parentId"]) {
  if (!parent) return "";
  if (typeof parent === "string") return parent;
  return parent._id;
}

function parentTitle(parent?: AdminCategory["parentId"]) {
  if (!parent) return "-";
  if (typeof parent === "string") return parent;
  return parent.title;
}
