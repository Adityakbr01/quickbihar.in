"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  RefreshCcw,
  Ruler,
  Save,
  Send,
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Trash2,
  Users,
  WalletCards,
  Warehouse,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SellerPayoutMethod, SellerPayoutMethodPayload, SellerSetupStatus } from "@/features/seller/api/sellerPanel.api";
import type {
  SellerBanner,
  SellerBannerPayload,
  SellerCoupon,
  SellerCouponPayload,
  SellerProduct,
  SellerProductPayload,
  SellerQueryParams,
  SellerSizeChart,
  SellerSizeChartPayload,
} from "@/features/seller/api/sellerManagement.api";
import {
  useSaveSellerStore,
  useSellerBannerMutations,
  useSellerBanners,
  useSellerCategories,
  useSellerCategoryRequest,
  useSellerCouponMutations,
  useSellerCoupons,
  useSellerCustomers,
  useSellerDashboard,
  useSellerInventory,
  useSellerMallMutations,
  useSellerNotificationMutation,
  useSellerNotifications,
  useSellerOrderStatusMutation,
  useSellerOrders,
  useSellerPayoutMutations,
  useSellerPayouts,
  useSellerProductMutations,
  useSellerProducts,
  useSellerReports,
  useSellerSizeChartMutations,
  useSellerSizeCharts,
  useSellerStore,
  useSellerSetupStatusV2,
  useSellerStockMutation,
  useToggleSellerStoreOpen,
} from "@/features/seller/hooks/useSellerManagement";
import { cn } from "@/lib/utils";

export const sellerNavigation = [
  {
    title: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { id: "inventory", label: "Inventory", icon: <Warehouse className="h-4 w-4" /> },
      { id: "orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Growth",
    items: [
      { id: "coupons", label: "Coupons", icon: <TicketPercent className="h-4 w-4" /> },
      { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
      { id: "banner", label: "Banner", icon: <ImageIcon className="h-4 w-4" /> },
      { id: "reports", label: "Reports", icon: <ReceiptText className="h-4 w-4" /> },
      { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    title: "Setup",
    items: [
      { id: "store", label: "Store", icon: <Store className="h-4 w-4" /> },
      { id: "mall", label: "Mall", icon: <Building2 className="h-4 w-4" /> },
      { id: "size-chart", label: "Size Chart", icon: <Ruler className="h-4 w-4" /> },
      { id: "payouts", label: "Payout & Earnings", icon: <WalletCards className="h-4 w-4" /> },
    ],
  },
] as const;

export type SellerSection = (typeof sellerNavigation)[number]["items"][number]["id"];

export const sectionLabels: Record<SellerSection, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  orders: "Orders",
  coupons: "Coupons",
  customers: "Customers",
  store: "Store",
  mall: "Mall",
  banner: "Banner",
  "size-chart": "Size Chart",
  payouts: "Payout & Earnings",
  reports: "Reports",
  notifications: "Notifications",
};

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
const labelClass = "grid gap-1 text-xs font-medium uppercase text-gray-500";

export function SellerSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: SellerSection;
  onSectionChange: (section: SellerSection) => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-[#101010] lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5 text-emerald-300" />
            <span className="text-lg font-semibold">Fashion Seller</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">QuickBihar Clothing</p>
        </div>

        <nav className="grid gap-5 p-4">
          {sellerNavigation.map((group) => (
            <div key={group.title}>
              <div className="mb-2 px-2 text-xs font-medium uppercase text-gray-500">{group.title}</div>
              <div className="grid gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white",
                      activeSection === item.id && "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function SellerSectionRenderer({ activeSection, setup }: { activeSection: SellerSection; setup?: SellerSetupStatus }) {
  if (activeSection === "dashboard") return <DashboardPanel />;
  if (activeSection === "store") return <StorePanel />;
  if (activeSection === "products") return <ProductsPanel />;
  if (activeSection === "categories") return <CategoriesPanel />;
  if (activeSection === "inventory") return <InventoryPanel />;
  if (activeSection === "orders") return <OrdersPanel />;
  if (activeSection === "coupons") return <CouponsPanel />;
  if (activeSection === "customers") return <CustomersPanel />;
  if (activeSection === "banner") return <BannersPanel />;
  if (activeSection === "size-chart") return <SizeChartsPanel />;
  if (activeSection === "payouts") return <PayoutPanel setup={setup} />;
  if (activeSection === "reports") return <ReportsPanel />;
  if (activeSection === "notifications") return <NotificationsPanel />;
  return <MallPanel setup={setup} />;
}

function DashboardPanel() {
  const dashboardQuery = useSellerDashboard();
  const dashboard = dashboardQuery.data;
  const setup = dashboard?.setup.setup;
  const wallet = dashboard?.setup.seller.wallet;
  const checklist = setup
    ? [
        { label: "Seller approval", done: setup.sellerApproved },
        { label: "Store created", done: setup.storeExists },
        { label: "Store configured", done: setup.storeConfigured },
        { label: "Store active", done: setup.storeActive },
        { label: "Payout verified", done: setup.hasVerifiedPayoutMethod },
        { label: "Products unlocked", done: setup.productsUnlocked },
        { label: "Mall optional", done: setup.mallOptional },
      ]
    : [];

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard..." />;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Available" value={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
        <Metric title="Products" value={dashboard?.stats.products.total || 0} icon={<Package className="h-4 w-4" />} />
        <Metric title="Low Stock" value={dashboard?.stats.lowStockCount || 0} icon={<Warehouse className="h-4 w-4" />} />
        <Metric title="Pending Reviews" value={dashboard?.stats.pendingReviews || 0} icon={<Send className="h-4 w-4" />} />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {checklist.map((item) => (
            <StatusTile key={item.label} title={item.label} label={item.done ? "Ready" : "Pending"} active={item.done} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              empty="No orders yet."
              columns={["Order", "Customer", "Status", "Amount"]}
              rows={(dashboard?.recentOrders || []).map((order) => [
                order.orderId,
                order.customer?.fullName || "Customer",
                <StatusBadge key={order._id} label={order.status} />,
                `Rs. ${formatAmount(order.sellerSubtotal || 0)}`,
              ])}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(dashboard?.recentNotifications || []).length ? (
              dashboard?.recentNotifications.map((item) => (
                <div key={item._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <StatusBadge label={item.severity} />
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{item.message}</div>
                </div>
              ))
            ) : (
              <EmptyState label="No notifications." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StorePanel() {
  const storeQuery = useSellerStore();
  const saveStore = useSaveSellerStore();
  const toggleOpen = useToggleSellerStoreOpen();
  const store = storeQuery.data?.store;
  const missingFields = storeQuery.data?.setup.missingFields || [];

  const submitStore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveStore.mutate({
      name: text(form, "name"),
      description: text(form, "description"),
      logoUrl: text(form, "logoUrl"),
      bannerUrl: text(form, "bannerUrl"),
      address: {
        line1: text(form, "line1"),
        city: text(form, "city"),
        state: text(form, "state"),
        pincode: text(form, "pincode"),
        country: text(form, "country") || "India",
        postalCode: text(form, "postalCode"),
      },
      contact: {
        email: text(form, "email"),
        phone: text(form, "phone"),
      },
      categoryConfig: {
        primaryCategory: text(form, "primaryCategory") || "Fashion",
        subcategories: list(text(form, "subcategories")),
      },
      deliveryConfig: {
        deliveryAreas: list(text(form, "deliveryAreas")),
        shippingFee: numberValue(form, "shippingFee"),
        freeShippingThreshold: numberValue(form, "freeShippingThreshold"),
      },
      seo: {
        storeTitle: text(form, "storeTitle"),
        metaTitle: text(form, "metaTitle"),
        metaDescription: text(form, "metaDescription"),
      },
      policies: {
        returnPolicy: text(form, "returnPolicy"),
        refundPolicy: text(form, "refundPolicy"),
        shippingPolicy: text(form, "shippingPolicy"),
        termsAndConditions: text(form, "termsAndConditions"),
      },
    });
  };

  if (storeQuery.isLoading) return <LoadingState label="Loading store..." />;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-3">
        <StatusTile title="Store" label={store?.name || "No store"} active={Boolean(store)} />
        <StatusTile title="Configuration" label={store?.isSetupComplete ? "Complete" : "Incomplete"} active={Boolean(store?.isSetupComplete)} />
        <StatusTile title="Availability" label={store?.isOpen ? "Open" : "Closed"} active={Boolean(store?.isOpen)} />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
            <span>Store Configuration</span>
            {store && (
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => toggleOpen.mutate(!store.isOpen)}>
                {store.isOpen ? "Close Store" : "Open Store"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form key={store?._id || "new-store"} onSubmit={submitStore} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="name" label="Store Name" defaultValue={store?.name} required />
              <Field name="email" label="Email" defaultValue={store?.contact?.email} />
              <Field name="phone" label="Phone" defaultValue={store?.contact?.phone} />
              <Field name="primaryCategory" label="Primary Category" defaultValue={store?.categoryConfig?.primaryCategory || "Fashion"} />
              <Field name="subcategories" label="Subcategories" defaultValue={(store?.categoryConfig?.subcategories || []).join(", ")} />
              <Field name="deliveryAreas" label="Delivery Areas" defaultValue={(store?.deliveryConfig?.deliveryAreas || []).join(", ")} />
              <Field name="shippingFee" label="Shipping Fee" type="number" defaultValue={store?.deliveryConfig?.shippingFee} />
              <Field name="freeShippingThreshold" label="Free Shipping Above" type="number" defaultValue={store?.deliveryConfig?.freeShippingThreshold} />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="logoUrl" label="Logo URL" defaultValue={store?.logoUrl} />
              <Field name="bannerUrl" label="Banner URL" defaultValue={store?.bannerUrl} />
              <Field name="line1" label="Address" defaultValue={store?.address?.line1} />
              <Field name="city" label="City" defaultValue={store?.address?.city} />
              <Field name="state" label="State" defaultValue={store?.address?.state} />
              <Field name="pincode" label="Pincode" defaultValue={store?.address?.pincode} />
              <Field name="country" label="Country" defaultValue={store?.address?.country || "India"} />
              <Field name="postalCode" label="Postal Code" defaultValue={store?.address?.postalCode} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field name="storeTitle" label="Store Title" defaultValue={store?.seo?.storeTitle} />
              <Field name="metaTitle" label="Meta Title" defaultValue={store?.seo?.metaTitle} />
              <Field name="metaDescription" label="Meta Description" defaultValue={store?.seo?.metaDescription} />
              <Field name="returnPolicy" label="Return Policy" defaultValue={store?.policies?.returnPolicy} />
              <Field name="refundPolicy" label="Refund Policy" defaultValue={store?.policies?.refundPolicy} />
              <Field name="shippingPolicy" label="Shipping Policy" defaultValue={store?.policies?.shippingPolicy} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={saveStore.isPending}>
                <Save className="h-4 w-4" />
                Save Store
              </Button>
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="border-amber-400/30 text-amber-300">{field}</Badge>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const productsQuery = useSellerProducts(params);
  const mutations = useSellerProductMutations();

  return (
    <ModuleCard
      title="Products"
      actions={<ProductDialog trigger={<Button><Plus className="h-4 w-4" />Create</Button>} onSubmit={(payload, images) => mutations.create.mutate({ payload, images })} />}
      filters={<ListFilters params={params} onChange={setParams} approval />}
    >
      <SimpleTable
        empty={productsQuery.isLoading ? "Loading products..." : "No products found."}
        columns={["Product", "Category", "Price", "Stock", "Approval", "Actions"]}
        rows={(productsQuery.data?.data || []).map((product) => [
          <div key={`${product._id}-title`} className="min-w-48">
            <div className="font-medium text-white">{product.title}</div>
            <div className="text-xs text-gray-500">{product.brand || product.details?.sku || product.slug}</div>
          </div>,
          [product.category, product.subCategory].filter(Boolean).join(" / "),
          `Rs. ${formatAmount(product.price)}`,
          product.totalStock ?? 0,
          <StatusBadge key={`${product._id}-status`} label={product.approvalStatus || "APPROVED"} />,
          <RowActions key={`${product._id}-actions`}>
            <ProductDialog
              product={product}
              trigger={<Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">Edit</Button>}
              onSubmit={(payload, images) => mutations.update.mutate({ productId: product._id, payload, images })}
            />
            <Button size="sm" variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20" onClick={() => mutations.submit.mutate(product._id)}>
              <Send className="h-3.5 w-3.5" />
            </Button>
            <DeleteButton onDelete={() => mutations.remove.mutate(product._id)} />
          </RowActions>,
        ])}
      />
      <PaginationBar result={productsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function CategoriesPanel() {
  const categoriesQuery = useSellerCategories();
  const requestCategory = useSellerCategoryRequest();

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    requestCategory.mutate({
      requestedPrimaryCategory: text(form, "requestedPrimaryCategory"),
      requestedSubcategories: list(text(form, "requestedSubcategories")),
      message: text(form, "message"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Assigned Categories</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <StatusTile title="Primary" label={categoriesQuery.data?.assigned?.primaryCategory || "Not assigned"} active={Boolean(categoriesQuery.data?.assigned?.primaryCategory)} />
          <div className="flex flex-wrap gap-2">
            {(categoriesQuery.data?.assigned?.subcategories || []).map((item) => (
              <Badge key={item} variant="outline" className="border-emerald-400/30 text-emerald-300">{item}</Badge>
            ))}
          </div>
          <SimpleTable
            empty="No category requests."
            columns={["Requested", "Status", "Reason"]}
            rows={(categoriesQuery.data?.requests || []).map((request) => [
              [request.requestedPrimaryCategory, ...(request.requestedSubcategories || [])].join(" / "),
              <StatusBadge key={request._id} label={request.status} />,
              request.rejectionReason || "-",
            ])}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Category Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitRequest} className="grid gap-3">
            <Field name="requestedPrimaryCategory" label="Primary Category" defaultValue="Fashion" required />
            <Field name="requestedSubcategories" label="Subcategories" />
            <Field name="message" label="Message" />
            <Button type="submit" disabled={requestCategory.isPending}>
              <Send className="h-4 w-4" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const inventoryQuery = useSellerInventory(params);
  const updateStock = useSellerStockMutation();

  const submitStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateStock.mutate({
      productId: text(form, "productId"),
      sku: text(form, "sku"),
      stock: numberValue(form, "stock") || 0,
      reason: text(form, "reason"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <ModuleCard title="Inventory" filters={<ListFilters params={params} onChange={setParams} />}>
        <SimpleTable
          empty={inventoryQuery.isLoading ? "Loading inventory..." : "No inventory found."}
          columns={["Product", "Variants", "Total", "Status"]}
          rows={(inventoryQuery.data?.data || []).map((product) => [
            <div key={`${product._id}-product`} className="min-w-48">
              <div className="font-medium text-white">{product.title}</div>
              <div className="text-xs text-gray-500">{product._id}</div>
            </div>,
            product.variants.map((variant) => `${variant.size}/${variant.color}: ${variant.stock} (${variant.sku})`).join(", "),
            product.totalStock ?? 0,
            product.lowStock ? <StatusBadge key={product._id} label="LOW" /> : <StatusBadge key={product._id} label="OK" />,
          ])}
        />
        <PaginationBar result={inventoryQuery.data} params={params} onChange={setParams} />
      </ModuleCard>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Update Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitStock} className="grid gap-3">
            <Field name="productId" label="Product ID" required />
            <Field name="sku" label="Variant SKU" required />
            <Field name="stock" label="New Stock" type="number" required />
            <Field name="reason" label="Reason" />
            <Button type="submit" disabled={updateStock.isPending}>
              <Save className="h-4 w-4" />
              Update Stock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const ordersQuery = useSellerOrders(params);
  const updateStatus = useSellerOrderStatusMutation();
  const [statusByOrder, setStatusByOrder] = useState<Record<string, "CONFIRMED" | "PROCESSING" | "SHIPPED">>({});

  return (
    <ModuleCard title="Orders" filters={<ListFilters params={params} onChange={setParams} statusOptions={["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]} />}>
      <SimpleTable
        empty={ordersQuery.isLoading ? "Loading orders..." : "No orders found."}
        columns={["Order", "Customer", "Items", "Amount", "Status", "Fulfillment"]}
        rows={(ordersQuery.data?.data || []).map((order) => [
          <div key={`${order._id}-order`}>
            <div className="font-medium text-white">{order.orderId}</div>
            <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
          </div>,
          order.customer?.fullName || order.shippingAddress?.fullName || "Customer",
          order.items.map((item) => `${item.title} x${item.quantity}`).join(", "),
          `Rs. ${formatAmount(order.sellerSubtotal || 0)}`,
          <StatusBadge key={`${order._id}-status`} label={order.status} />,
          <RowActions key={`${order._id}-actions`}>
            <select value={statusByOrder[order._id] || "PROCESSING"} onChange={(event) => setStatusByOrder((prev) => ({ ...prev, [order._id]: event.target.value as "CONFIRMED" | "PROCESSING" | "SHIPPED" }))} className={selectClass}>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
            </select>
            <Button size="sm" onClick={() => updateStatus.mutate({ orderId: order._id, status: statusByOrder[order._id] || "PROCESSING" })}>Update</Button>
          </RowActions>,
        ])}
      />
      <PaginationBar result={ordersQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function CouponsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const couponsQuery = useSellerCoupons(params);
  const mutations = useSellerCouponMutations();

  return (
    <ModuleCard title="Coupons" actions={<CouponDialog trigger={<Button><Plus className="h-4 w-4" />Create</Button>} onSubmit={(payload) => mutations.create.mutate(payload)} />} filters={<ListFilters params={params} onChange={setParams} approval />}>
      <SimpleTable
        empty={couponsQuery.isLoading ? "Loading coupons..." : "No coupons found."}
        columns={["Code", "Rule", "Usage", "Dates", "Approval", "Actions"]}
        rows={(couponsQuery.data?.data || []).map((coupon) => [
          <div key={`${coupon._id}-code`} className="font-medium text-white">{coupon.code}</div>,
          `${coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `Rs. ${formatAmount(coupon.discountValue)}`} off`,
          `${coupon.usedCount}/${coupon.usageLimit}`,
          `${formatDate(coupon.startDate)} - ${formatDate(coupon.endDate)}`,
          <StatusBadge key={`${coupon._id}-status`} label={coupon.approvalStatus || "APPROVED"} />,
          <RowActions key={`${coupon._id}-actions`}>
            <CouponDialog coupon={coupon} trigger={<Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">Edit</Button>} onSubmit={(payload) => mutations.update.mutate({ couponId: coupon._id, payload })} />
            <Button size="sm" variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20" onClick={() => mutations.submit.mutate(coupon._id)}>
              <Send className="h-3.5 w-3.5" />
            </Button>
            <DeleteButton onDelete={() => mutations.remove.mutate(coupon._id)} />
          </RowActions>,
        ])}
      />
      <PaginationBar result={couponsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function CustomersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const customersQuery = useSellerCustomers(params);

  return (
    <ModuleCard title="Customers" filters={<ListFilters params={params} onChange={setParams} />}>
      <SimpleTable
        empty={customersQuery.isLoading ? "Loading customers..." : "No customers found."}
        columns={["Customer", "Contact", "Orders", "Revenue", "Last Order"]}
        rows={(customersQuery.data?.data || []).map((customer) => [
          customer.fullName || "Customer",
          [customer.email, customer.phone].filter(Boolean).join(" / ") || "-",
          customer.orderCount,
          `Rs. ${formatAmount(customer.revenue)}`,
          formatDate(customer.lastOrderAt),
        ])}
      />
      <PaginationBar result={customersQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function BannersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const bannersQuery = useSellerBanners(params);
  const mutations = useSellerBannerMutations();

  return (
    <ModuleCard title="Banners" actions={<BannerDialog trigger={<Button><Plus className="h-4 w-4" />Create</Button>} onSubmit={(payload, image) => mutations.create.mutate({ payload, image })} />} filters={<ListFilters params={params} onChange={setParams} approval />}>
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
          banner.placement,
          banner.priority || 0,
          <StatusBadge key={`${banner._id}-status`} label={banner.approvalStatus || "APPROVED"} />,
          <RowActions key={`${banner._id}-actions`}>
            <BannerDialog banner={banner} trigger={<Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">Edit</Button>} onSubmit={(payload, image) => mutations.update.mutate({ bannerId: banner._id, payload, image })} />
            <Button size="sm" variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20" onClick={() => mutations.submit.mutate(banner._id)}>
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

function SizeChartsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const chartsQuery = useSellerSizeCharts(params);
  const productsQuery = useSellerProducts({ page: 1, limit: 100 });
  const mutations = useSellerSizeChartMutations();

  return (
    <ModuleCard title="Size Charts" actions={<SizeChartDialog trigger={<Button><Plus className="h-4 w-4" />Create</Button>} onSubmit={(payload) => mutations.create.mutate(payload)} />} filters={<ListFilters params={params} onChange={setParams} approval />}>
      <SimpleTable
        empty={chartsQuery.isLoading ? "Loading size charts..." : "No size charts found."}
        columns={["Chart", "Fields", "Scope", "Approval", "Actions"]}
        rows={(chartsQuery.data?.data || []).map((chart) => [
          <div key={`${chart._id}-chart`}>
            <div className="font-medium text-white">{chart.name}</div>
            <div className="text-xs text-gray-500">{chart.category} / {chart.unit}</div>
          </div>,
          chart.fields.join(", "),
          chart.scope || "GLOBAL",
          <StatusBadge key={`${chart._id}-status`} label={chart.approvalStatus || "APPROVED"} />,
          <RowActions key={`${chart._id}-actions`}>
            {chart.scope === "SELLER" && (
              <>
                <SizeChartDialog chart={chart} trigger={<Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">Edit</Button>} onSubmit={(payload) => mutations.update.mutate({ chartId: chart._id, payload })} />
                <Button size="sm" variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20" onClick={() => mutations.submit.mutate(chart._id)}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <DeleteButton onDelete={() => mutations.remove.mutate(chart._id)} />
              </>
            )}
            <AssignSizeChartDialog
              chart={chart}
              products={productsQuery.data?.data || []}
              onAssign={(productIds) => mutations.assign.mutate({ chartId: chart._id, productIds })}
            />
          </RowActions>,
        ])}
      />
      <PaginationBar result={chartsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function PayoutPanel({ setup }: { setup?: SellerSetupStatus }) {
  const setupQuery = useSellerSetupStatusV2();
  const payoutsQuery = useSellerPayouts();
  const payoutMutations = useSellerPayoutMutations();
  const currentSetup = setup || setupQuery.data;
  const wallet = currentSetup?.seller.wallet;
  const rawMethods = currentSetup?.seller.payoutMethods;
  const methods = useMemo(() => rawMethods || [], [rawMethods]);
  const verifiedMethods = useMemo(() => methods.filter((method) => method.status === "VERIFIED"), [methods]);

  const submitMethod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = text(form, "type") as "UPI" | "BANK";
    const payload: SellerPayoutMethodPayload =
      type === "UPI"
        ? { type: "UPI", upi: { upiId: text(form, "upiId") } }
        : {
            type: "BANK",
            bank: {
              accountHolderName: text(form, "accountHolderName"),
              accountNumber: text(form, "accountNumber"),
              ifsc: text(form, "ifsc"),
              bankName: text(form, "bankName"),
            },
          };
    payoutMutations.addMethod.mutate(payload);
  };

  const submitPayout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    payoutMutations.request.mutate({
      amount: numberValue(form, "amount") || 0,
      payoutMethodId: text(form, "payoutMethodId"),
      note: text(form, "note"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Wallet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <StatusTile title="Available" label={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`} active />
          <StatusTile title="Pending" label={`Rs. ${formatAmount(wallet?.pendingPayoutBalance || 0)}`} active={Boolean(wallet?.pendingPayoutBalance)} />
          <StatusTile title="Lifetime" label={`Rs. ${formatAmount(wallet?.lifetimeEarnings || 0)}`} active />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Payout Methods</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {methods.length ? methods.map((method) => (
            <div key={method._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{method.type}</div>
                  <div className="text-xs text-gray-500">{payoutMethodLabel(method)}</div>
                </div>
                <StatusBadge label={method.status} />
              </div>
              {method.status === "VERIFIED" && !method.isDefault && (
                <Button size="sm" variant="outline" className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => payoutMutations.setDefault.mutate(method._id)}>
                  Set Default
                </Button>
              )}
            </div>
          )) : <EmptyState label="No payout methods." />}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Add Method</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitMethod} className="grid gap-3">
            <label className={labelClass}>
              Type
              <select name="type" className={selectClass} defaultValue="UPI">
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
            </label>
            <Field name="upiId" label="UPI ID" />
            <Field name="accountHolderName" label="Account Holder" />
            <Field name="accountNumber" label="Account Number" />
            <Field name="ifsc" label="IFSC" />
            <Field name="bankName" label="Bank Name" />
            <Button type="submit">
              <WalletCards className="h-4 w-4" />
              Submit Method
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Payout Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={submitPayout} className="grid gap-3">
            <label className={labelClass}>
              Method
              <select name="payoutMethodId" required className={selectClass}>
                <option value="">Verified method</option>
                {verifiedMethods.map((method) => (
                  <option key={method._id} value={method._id}>{method.type} - {payoutMethodLabel(method)}</option>
                ))}
              </select>
            </label>
            <Field name="amount" label="Amount" type="number" required />
            <Field name="note" label="Note" />
            <Button type="submit" disabled={!verifiedMethods.length}>
              <WalletCards className="h-4 w-4" />
              Request Payout
            </Button>
          </form>
          <SimpleTable
            empty={payoutsQuery.isLoading ? "Loading payouts..." : "No payout requests."}
            columns={["Amount", "Status", "Method", "Date"]}
            rows={(payoutsQuery.data?.payouts as Array<Record<string, unknown>> | undefined || []).map((payout) => [
              `Rs. ${formatAmount(Number(payout.amount || 0))}`,
              <StatusBadge key={String(payout._id)} label={String(payout.status || "PENDING")} />,
              String(payout.method || "-"),
              formatDate(String(payout.createdAt || "")),
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({});
  const reportsQuery = useSellerReports(params);
  const reports = reportsQuery.data;

  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex flex-col gap-3 text-base text-white md:flex-row md:items-center md:justify-between">
            <span>Reports</span>
            <div className="flex flex-wrap gap-2">
              <Input type="date" className={inputClass} onChange={(event) => setParams((prev) => ({ ...prev, dateFrom: event.target.value }))} />
              <Input type="date" className={inputClass} onChange={(event) => setParams((prev) => ({ ...prev, dateTo: event.target.value }))} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric title="Orders" value={reports?.summary.orders || 0} icon={<ClipboardList className="h-4 w-4" />} />
            <Metric title="Units Sold" value={reports?.summary.unitsSold || 0} icon={<Package className="h-4 w-4" />} />
            <Metric title="Gross Revenue" value={`Rs. ${formatAmount(reports?.summary.grossRevenue || 0)}`} icon={<ReceiptText className="h-4 w-4" />} />
            <Metric title="Customers" value={reports?.summary.customers || 0} icon={<Users className="h-4 w-4" />} />
          </section>
          <SimpleTable
            empty={reportsQuery.isLoading ? "Loading reports..." : "No product performance."}
            columns={["Product", "SKU", "Quantity", "Revenue"]}
            rows={(reports?.productPerformance || []).map((item) => [
              item.title,
              item.sku,
              item.quantity,
              `Rs. ${formatAmount(item.revenue)}`,
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const notificationsQuery = useSellerNotifications(params);
  const markRead = useSellerNotificationMutation();

  return (
    <ModuleCard title="Notifications" filters={<ListFilters params={params} onChange={setParams} statusOptions={["ALL", "unread", "read"]} />}>
      <SimpleTable
        empty={notificationsQuery.isLoading ? "Loading notifications..." : "No notifications."}
        columns={["Notification", "Type", "Severity", "Date", "Action"]}
        rows={(notificationsQuery.data?.data || []).map((notification) => [
          <div key={`${notification._id}-note`} className="min-w-64">
            <div className="font-medium text-white">{notification.title}</div>
            <div className="text-xs text-gray-500">{notification.message}</div>
          </div>,
          notification.type,
          <StatusBadge key={`${notification._id}-severity`} label={notification.severity} />,
          formatDate(notification.createdAt),
          notification.isRead ? "Read" : <Button key={`${notification._id}-action`} size="sm" onClick={() => markRead.mutate(notification._id)}>Mark Read</Button>,
        ])}
      />
      <PaginationBar result={notificationsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}

function MallPanel({ setup }: { setup?: SellerSetupStatus }) {
  const setupQuery = useSellerSetupStatusV2();
  const currentSetup = setup || setupQuery.data;
  const mallMutations = useSellerMallMutations();

  const submitConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mallMutations.requestConnection.mutate({
      mallId: text(form, "mallId"),
      mallUnit: text(form, "mallUnit"),
      mallFloor: text(form, "mallFloor"),
      message: text(form, "message"),
    });
  };

  const submitCreation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mallMutations.requestCreation.mutate({
      name: text(form, "name"),
      address: {
        city: text(form, "city"),
        state: text(form, "state"),
      },
      mallUnit: text(form, "newMallUnit"),
      mallFloor: text(form, "newMallFloor"),
      message: text(form, "newMessage"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Mall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTile
            title="Current Mall"
            label={currentSetup?.seller.mallName ? [currentSetup.seller.mallName, currentSetup.seller.mallUnit, currentSetup.seller.mallFloor].filter(Boolean).join(" / ") : "Independent seller"}
            active={Boolean(currentSetup?.seller.mallName)}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Connect Existing Mall</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitConnection} className="grid gap-3">
            <Field name="mallId" label="Mall ID" required />
            <Field name="mallUnit" label="Unit" />
            <Field name="mallFloor" label="Floor" />
            <Field name="message" label="Message" />
            <Button type="submit">
              <Building2 className="h-4 w-4" />
              Request Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Request New Mall</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCreation} className="grid gap-3">
            <Field name="name" label="Mall Name" required />
            <Field name="city" label="City" />
            <Field name="state" label="State" />
            <Field name="newMallUnit" label="Unit" />
            <Field name="newMallFloor" label="Floor" />
            <Field name="newMessage" label="Message" />
            <Button type="submit">
              <Building2 className="h-4 w-4" />
              Request Mall
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductDialog({
  product,
  trigger,
  onSubmit,
}: {
  product?: SellerProduct;
  trigger: ReactNode;
  onSubmit: (payload: SellerProductPayload, images: File[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const images = files(form, "images");
    onSubmit({
      title: text(form, "title"),
      brand: text(form, "brand"),
      category: text(form, "category") || "Fashion",
      subCategory: text(form, "subCategory"),
      price: numberValue(form, "price") || 0,
      originalPrice: numberValue(form, "originalPrice"),
      description: text(form, "description"),
      shortDescription: text(form, "shortDescription"),
      variants: [{
        size: text(form, "size") || "M",
        color: text(form, "color") || "Default",
        stock: numberValue(form, "stock") || 0,
        price: numberValue(form, "variantPrice"),
        sku: text(form, "sku") || undefined,
      }],
      details: {
        sku: text(form, "baseSku") || undefined,
      },
      tags: list(text(form, "tags")),
      seo: {
        metaTitle: text(form, "metaTitle"),
        metaDescription: text(form, "metaDescription"),
        keywords: list(text(form, "keywords")),
      },
    }, images);
    setOpen(false);
  };

  const variant = product?.variants?.[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="title" label="Name" defaultValue={product?.title} required />
            <Field name="brand" label="Brand" defaultValue={product?.brand} />
            <Field name="category" label="Category" defaultValue={product?.category || "Fashion"} required />
            <Field name="subCategory" label="Subcategory" defaultValue={product?.subCategory} />
            <Field name="price" label="Price" type="number" defaultValue={product?.price} required />
            <Field name="originalPrice" label="Original Price" type="number" defaultValue={product?.originalPrice} />
            <Field name="size" label="Size" defaultValue={variant?.size || "M"} required />
            <Field name="color" label="Color" defaultValue={variant?.color || "Black"} required />
            <Field name="stock" label="Stock" type="number" defaultValue={variant?.stock || 0} required />
            <Field name="variantPrice" label="Variant Price" type="number" defaultValue={variant?.price} />
            <Field name="sku" label="Variant SKU" defaultValue={variant?.sku} />
            <Field name="baseSku" label="Base SKU" defaultValue={product?.details?.sku} />
            <Field name="tags" label="Tags" />
            <Field name="keywords" label="SEO Keywords" />
            <Field name="metaTitle" label="Meta Title" defaultValue={product?.seo?.metaTitle} />
            <Field name="metaDescription" label="Meta Description" defaultValue={product?.seo?.metaDescription} />
            <Field name="shortDescription" label="Short Description" defaultValue={product?.shortDescription} />
            <Field name="description" label="Description" defaultValue={product?.description} />
          </div>
          <label className={labelClass}>
            Images
            <Input name="images" type="file" multiple accept="image/*" className={inputClass} required={!product} />
          </label>
          <DialogFooter className="border-white/10 bg-white/[0.03]">
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      code: text(form, "code"),
      description: text(form, "description"),
      discountType: text(form, "discountType") as "PERCENTAGE" | "FIXED",
      discountValue: numberValue(form, "discountValue") || 0,
      minOrderValue: numberValue(form, "minOrderValue"),
      maxDiscountAmount: numberValue(form, "maxDiscountAmount"),
      usageLimit: numberValue(form, "usageLimit"),
      usageLimitPerUser: numberValue(form, "usageLimitPerUser"),
      startDate: text(form, "startDate"),
      endDate: text(form, "endDate"),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <select name="discountType" defaultValue={coupon?.discountType || "PERCENTAGE"} className={selectClass}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </label>
            <Field name="discountValue" label="Discount Value" type="number" defaultValue={coupon?.discountValue} required />
            <Field name="minOrderValue" label="Minimum Order" type="number" defaultValue={coupon?.minOrderValue} />
            <Field name="maxDiscountAmount" label="Maximum Discount" type="number" defaultValue={coupon?.maxDiscountAmount} />
            <Field name="usageLimit" label="Usage Limit" type="number" defaultValue={coupon?.usageLimit || 100} />
            <Field name="usageLimitPerUser" label="Per User Limit" type="number" defaultValue={coupon?.usageLimitPerUser || 1} />
            <Field name="startDate" label="Start Date" type="date" defaultValue={dateInput(coupon?.startDate)} />
            <Field name="endDate" label="End Date" type="date" defaultValue={dateInput(coupon?.endDate)} required />
            <Field name="description" label="Description" defaultValue={coupon?.description} required />
          </div>
          <DialogFooter className="border-white/10 bg-white/[0.03]">
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
    onSubmit({
      title: text(form, "title"),
      subtitle: text(form, "subtitle"),
      redirectType: text(form, "redirectType") as "product" | "category" | "collection" | "external",
      externalUrl: text(form, "externalUrl"),
      placement: text(form, "placement") as "home_top" | "home_middle" | "category",
      priority: numberValue(form, "priority"),
    }, files(form, "image")[0]);
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
              <select name="redirectType" defaultValue={banner?.redirectType || "external"} className={selectClass}>
                <option value="external">External</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="collection">Collection</option>
              </select>
            </label>
            <label className={labelClass}>
              Placement
              <select name="placement" defaultValue={banner?.placement || "home_top"} className={selectClass}>
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
            <Input name="image" type="file" accept="image/*" className={inputClass} required={!banner} />
          </label>
          <DialogFooter className="border-white/10 bg-white/[0.03]">
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

function SizeChartDialog({
  chart,
  trigger,
  onSubmit,
}: {
  chart?: SellerSizeChart;
  trigger: ReactNode;
  onSubmit: (payload: SellerSizeChartPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: text(form, "name"),
      category: text(form, "category") || "Fashion",
      unit: text(form, "unit") as "inches" | "cm",
      fields: list(text(form, "fields")),
      data: parseRows(text(form, "data")),
      howToMeasure: list(text(form, "howToMeasure")),
      productIds: list(text(form, "productIds")),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as never} />
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{chart ? "Edit Size Chart" : "Create Size Chart"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field name="name" label="Name" defaultValue={chart?.name} required />
            <Field name="category" label="Category" defaultValue={chart?.category || "Fashion"} required />
            <label className={labelClass}>
              Unit
              <select name="unit" defaultValue={chart?.unit || "inches"} className={selectClass}>
                <option value="inches">Inches</option>
                <option value="cm">CM</option>
              </select>
            </label>
            <Field name="fields" label="Fields" defaultValue={(chart?.fields || ["size", "chest", "length"]).join(", ")} required />
            <Field name="productIds" label="Product IDs" defaultValue={(chart?.productIds || []).join(", ")} />
            <Field name="howToMeasure" label="How To Measure" defaultValue={(chart?.howToMeasure || []).join(", ")} />
          </div>
          <label className={labelClass}>
            Rows JSON
            <textarea
              name="data"
              defaultValue={JSON.stringify(chart?.data || [{ size: "M", chest: 38, length: 27 }], null, 2)}
              className="min-h-32 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none"
              required
            />
          </label>
          <DialogFooter className="border-white/10 bg-white/[0.03]">
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

function AssignSizeChartDialog({
  chart,
  products,
  onAssign,
}: {
  chart: SellerSizeChart;
  products: SellerProduct[];
  onAssign: (productIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(chart.productIds || []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">Assign</Button>} />
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Products</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-80 gap-2 overflow-y-auto">
          {products.map((product) => (
            <label key={product._id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(product._id)}
                onChange={(event) => {
                  setSelected((prev) => event.target.checked ? [...prev, product._id] : prev.filter((id) => id !== product._id));
                }}
              />
              <span>{product.title}</span>
            </label>
          ))}
        </div>
        <DialogFooter className="border-white/10 bg-white/[0.03]">
          <Button onClick={() => { onAssign(selected); setOpen(false); }}>
            <Save className="h-4 w-4" />
            Save Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleCard({
  title,
  actions,
  filters,
  children,
}: {
  title: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex flex-col gap-3 text-base text-white lg:flex-row lg:items-center lg:justify-between">
          <span>{title}</span>
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            {actions}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {children}
      </CardContent>
    </Card>
  );
}

function ListFilters({
  params,
  onChange,
  approval,
  statusOptions,
}: {
  params: SellerQueryParams;
  onChange: (params: SellerQueryParams) => void;
  approval?: boolean;
  statusOptions?: string[];
}) {
  return (
    <>
      <Input
        value={params.search || ""}
        onChange={(event) => onChange({ ...params, search: event.target.value, page: 1 })}
        placeholder="Search"
        className={cn(inputClass, "w-44")}
      />
      {statusOptions && (
        <select value={params.status || "ALL"} onChange={(event) => onChange({ ...params, status: event.target.value, page: 1 })} className={selectClass}>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      )}
      {approval && (
        <select value={params.approvalStatus || "ALL"} onChange={(event) => onChange({ ...params, approvalStatus: event.target.value, page: 1 })} className={selectClass}>
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      )}
      <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onChange({ page: 1, limit: params.limit || 10 })}>
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </>
  );
}

function PaginationBar({
  result,
  params,
  onChange,
}: {
  result?: { page: number; totalPages: number; total: number };
  params: SellerQueryParams;
  onChange: (params: SellerQueryParams) => void;
}) {
  if (!result) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm text-gray-400">
      <span>{result.total} total</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={(params.page || 1) <= 1} className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onChange({ ...params, page: Math.max(1, (params.page || 1) - 1) })}>Previous</Button>
        <span>Page {result.page} / {Math.max(1, result.totalPages)}</span>
        <Button size="sm" variant="outline" disabled={(params.page || 1) >= result.totalPages} className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onChange({ ...params, page: (params.page || 1) + 1 })}>Next</Button>
      </div>
    </div>
  );
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column} className="text-gray-400">{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? rows.map((row, index) => (
          <TableRow key={index} className="border-white/10 hover:bg-white/[0.03]">
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex} className="max-w-[360px] text-gray-300">{cell}</TableCell>
            ))}
          </TableRow>
        )) : (
          <TableRow className="border-white/10">
            <TableCell colSpan={columns.length} className="py-8 text-center text-gray-500">{empty}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <Input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} className={inputClass} />
    </label>
  );
}

function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20"
      onClick={() => {
        if (window.confirm("Delete this item?")) onDelete();
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]" size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-emerald-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

function StatusTile({ title, label, active }: { title: string; label: string; active: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">{label}</div>
        {active ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const normalized = label.toUpperCase();
  const positive = ["APPROVED", "SUCCESS", "OK", "VERIFIED", "DELIVERED", "PAID", "ACTIVE"].includes(normalized);
  const warning = ["PENDING", "PENDING_REVIEW", "DRAFT", "LOW", "PROCESSING", "SHIPPED", "INFO", "WARNING"].includes(normalized);
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        positive && "border-emerald-400/30 text-emerald-300",
        warning && "border-amber-400/30 text-amber-300",
        !positive && !warning && "border-red-400/30 text-red-300",
      )}
    >
      {label}
    </Badge>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="py-10 text-sm text-gray-400">{label}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">{label}</div>;
}

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(form: FormData, key: string) {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function list(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function files(form: FormData, key: string) {
  return form.getAll(key).filter((item): item is File => item instanceof File && item.size > 0);
}

function parseRows(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function dateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function payoutMethodLabel(method: SellerPayoutMethod) {
  if (method.type === "BANK") {
    const account = method.bank?.accountNumber || "";
    return [method.bank?.bankName, account ? `A/C ${account.slice(-4)}` : undefined].filter(Boolean).join(" - ") || "Bank account";
  }
  if (method.type === "UPI") return method.upi?.upiId || "UPI";
  if (method.type === "PAYPAL") return method.paypal?.email || "PayPal";
  return method.stripeConnect?.accountId || "Stripe Connect";
}
