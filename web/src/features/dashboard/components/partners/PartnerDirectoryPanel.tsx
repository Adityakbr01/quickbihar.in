"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  RefreshCcw,
  Store,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";
import {
  useAdminRiders,
  useAdminSellers,
  useAdminSubOrders,
  useCreatePayout,
  useRiderInsights,
  useSellerInsights,
  useSetBlocked,
  useSettleRiderCod,
  useUpdatePartnerStatus,
} from "../../hooks/useAdminManagement";
import type {
  AdminListParams,
  AdminSubOrder,
  ManagedPerson,
  PartnerInsight,
  PartnerProfile,
  PartnerTransaction,
  PartnerType,
  PayoutStatus,
} from "../../api/adminManagement.api";
import {
  downloadCsv,
  downloadXlsx,
  formatAmount,
  formatDate,
  formatDateTime,
  optionalValue,
  type ExportRow,
} from "../../utils";
import { inputClass, selectClass, textareaClass } from "../types";
import { EmptyState, LoadingState, PaginationFooter } from "../shared/TableHelpers";
import { PayoutPartnerBadge, StatusBadge } from "../badges";

type PartnerKind = "seller" | "rider";

const partnerStatuses = [
  { value: "ALL", label: "All statuses" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
];

const detailTabs = ["Overview", "Orders", "Transactions", "Reports"] as const;
type DetailTab = (typeof detailTabs)[number];

export function SellerDirectoryPanel() {
  const [params, setParams] = useState<AdminListParams>({
    search: "",
    status: "ALL",
  });
  const sellersQuery = useAdminSellers(cleanListParams(params));
  return (
    <PartnerDirectoryContent
      kind="seller"
      params={params}
      onParams={setParams}
      people={sellersQuery.data || []}
      isLoading={sellersQuery.isLoading}
      onRefresh={() => sellersQuery.refetch()}
    />
  );
}

export function RiderDirectoryPanel() {
  const [params, setParams] = useState<AdminListParams>({
    search: "",
    status: "ALL",
  });
  const ridersQuery = useAdminRiders(cleanListParams(params));
  return (
    <PartnerDirectoryContent
      kind="rider"
      params={params}
      onParams={setParams}
      people={ridersQuery.data || []}
      isLoading={ridersQuery.isLoading}
      onRefresh={() => ridersQuery.refetch()}
    />
  );
}

function PartnerDirectoryContent({
  kind,
  params,
  onParams,
  people,
  isLoading,
  onRefresh,
}: {
  kind: PartnerKind;
  params: AdminListParams;
  onParams: (params: AdminListParams) => void;
  people: ManagedPerson[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<ManagedPerson | null>(null);
  const setBlocked = useSetBlocked();
  const updatePartnerStatus = useUpdatePartnerStatus();
  const partnerType: PartnerType = kind === "seller" ? "SELLER" : "DELIVERY";
  const title = kind === "seller" ? "Seller Hub" : "Rider Hub";
  const icon =
    kind === "seller" ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  const summary = useMemo(() => summarizePeople(kind, people), [kind, people]);

  const updateParam = (key: keyof AdminListParams, value?: string) => {
    onParams({
      ...params,
      [key]: value,
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PartnerMetric label={`Total ${kind === "seller" ? "sellers" : "riders"}`} value={people.length} />
        <PartnerMetric label="Approved" value={summary.approved} tone="emerald" />
        <PartnerMetric
          label="Wallet available"
          value={`Rs. ${formatAmount(summary.availableBalance)}`}
          tone="cyan"
        />
        <PartnerMetric
          label={kind === "rider" ? "COD liability" : "Pending payouts"}
          value={`Rs. ${formatAmount(kind === "rider" ? summary.codLiability : summary.pendingPayoutBalance)}`}
          tone={kind === "rider" && summary.codLiability ? "amber" : "slate"}
        />
      </div>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="gap-4 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              {icon}
              {title}
            </CardTitle>
            <div className="mt-1 text-xs text-gray-500">
              Profile, orders, transactions, reports, and exports in one place.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onRefresh}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px]">
          <Input
            value={params.search || ""}
            onChange={(event) => updateParam("search", event.target.value)}
            placeholder={`Search ${kind === "seller" ? "seller" : "rider"}`}
            className={inputClass}
          />
          <select
            value={params.status || "ALL"}
            onChange={(event) =>
              updateParam("status", event.target.value === "ALL" ? "ALL" : event.target.value)
            }
            className={selectClass}
          >
            {partnerStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {isLoading && <LoadingState label={`Loading ${kind === "seller" ? "sellers" : "riders"}...`} />}
          {!isLoading && !people.length && <EmptyState label={`No ${kind === "seller" ? "sellers" : "riders"} found.`} />}
          {!isLoading && Boolean(people.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Partner</TableHead>
                  <TableHead className="text-gray-400">Profile</TableHead>
                  <TableHead className="text-gray-400">Wallet</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => {
                  const profile = profileFor(kind, person);
                  return (
                    <TableRow key={person._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4">
                        <div className="font-medium text-white">{partnerDisplayName(kind, person)}</div>
                        <div className="text-xs text-gray-500">{person.email}</div>
                        <div className="mt-1 text-xs text-gray-500">{person.phone || "No phone"}</div>
                      </TableCell>
                      <TableCell>
                        <PartnerProfileCell kind={kind} profile={profile} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-white">
                          Rs. {formatAmount(profile?.wallet?.availableBalance || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Pending Rs. {formatAmount(profile?.wallet?.pendingPayoutBalance || 0)}
                        </div>
                        {kind === "rider" && (
                          <div className="text-xs text-amber-300">
                            COD Rs. {formatAmount(profile?.wallet?.collectedCodLiability || 0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <PartnerStatusBadge status={profile?.status} />
                          {person.isBlocked && <StatusBadge active={false} label="Blocked" />}
                          {kind === "rider" && (
                            <Badge
                              variant="outline"
                              className={
                                profile?.isOnline
                                  ? "border-emerald-400/30 text-emerald-300"
                                  : "border-white/10 text-gray-400"
                              }
                            >
                              {profile?.isOnline ? "Online" : "Offline"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => setSelected(person)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {profile?.status !== "APPROVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                              disabled={updatePartnerStatus.isPending}
                              onClick={() =>
                                updatePartnerStatus.mutate({
                                  userId: person._id,
                                  type: partnerType,
                                  status: "APPROVED",
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                          )}
                          {profile?.status !== "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20"
                              disabled={updatePartnerStatus.isPending}
                              onClick={() =>
                                updatePartnerStatus.mutate({
                                  userId: person._id,
                                  type: partnerType,
                                  status: "REJECTED",
                                })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={person.isBlocked ? "outline" : "destructive"}
                            className={
                              person.isBlocked
                                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                : ""
                            }
                            disabled={setBlocked.isPending}
                            onClick={() =>
                              setBlocked.mutate({
                                userId: person._id,
                                isBlocked: !person.isBlocked,
                              })
                            }
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {person.isBlocked ? "Unban" : "Ban"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <PartnerDetailDialog
          kind={kind}
          partner={selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </div>
  );
}

function PartnerDetailDialog({
  kind,
  partner,
  onOpenChange,
}: {
  kind: PartnerKind;
  partner: ManagedPerson;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const [dateParams, setDateParams] = useState<AdminListParams>({});
  const [ordersPage, setOrdersPage] = useState(1);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [codOpen, setCodOpen] = useState(false);
  const sellerInsights = useSellerInsights(kind === "seller" ? partner._id : "", dateParams);
  const riderInsights = useRiderInsights(kind === "rider" ? partner._id : "", dateParams);
  const ordersQuery = useAdminSubOrders({
    page: ordersPage,
    limit: 100,
    sellerId: kind === "seller" ? partner._id : undefined,
    riderId: kind === "rider" ? partner._id : undefined,
  });
  const insight = kind === "seller" ? sellerInsights.data : riderInsights.data;
  const isInsightLoading = kind === "seller" ? sellerInsights.isLoading : riderInsights.isLoading;
  const orders = ordersQuery.data?.data || [];
  const profile = profileFor(kind, partner);
  const partnerType: PartnerType = kind === "seller" ? "SELLER" : "DELIVERY";
  const title = `${kind === "seller" ? "Seller" : "Rider"} details`;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {title}
            <PayoutPartnerBadge type={partnerType} />
          </DialogTitle>
          <div className="text-sm text-gray-400">
            {partnerDisplayName(kind, partner)} / {partner.email}
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-2 sm:grid-cols-2">
              <DatePicker
                value={(dateParams.dateFrom as string) || ""}
                onChange={(value) => setDateParams((current) => ({ ...current, dateFrom: value || undefined }))}
                placeholder="Date from"
                className={inputClass}
              />
              <DatePicker
                value={(dateParams.dateTo as string) || ""}
                onChange={(value) => setDateParams((current) => ({ ...current, dateTo: value || undefined }))}
                placeholder="Date to"
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={!insight}
                onClick={() => insight && exportPartnerCsv(kind, insight, orders)}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={!insight}
                onClick={() => insight && exportPartnerXlsx(kind, insight, orders)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                XLSX
              </Button>
              <Button onClick={() => setPayoutOpen(true)}>
                <WalletCards className="h-4 w-4" />
                Record Payout
              </Button>
              {kind === "rider" && Number(profile?.wallet?.collectedCodLiability || 0) > 0 && (
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => setCodOpen(true)}
                >
                  <Coins className="h-4 w-4" />
                  Settle COD
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
            {detailTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm transition-colors",
                  activeTab === tab
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {isInsightLoading && <LoadingState label="Loading partner insights..." />}
          {!isInsightLoading && insight && activeTab === "Overview" && (
            <PartnerOverview kind={kind} insight={insight} />
          )}
          {!isInsightLoading && activeTab === "Orders" && (
            <PartnerOrdersTable
              orders={orders}
              isLoading={ordersQuery.isLoading}
              page={ordersPage}
              totalPages={ordersQuery.data?.totalPages || 1}
              onPage={setOrdersPage}
            />
          )}
          {!isInsightLoading && insight && activeTab === "Transactions" && (
            <PartnerTransactionsTable transactions={insight.transactions} />
          )}
          {!isInsightLoading && insight && activeTab === "Reports" && (
            <PartnerReports insight={insight} />
          )}
        </div>

        <RecordPayoutDialog
          open={payoutOpen}
          partner={partner}
          type={partnerType}
          onOpenChange={setPayoutOpen}
        />
        {kind === "rider" && (
          <SettleCodDialog
            open={codOpen}
            partner={partner}
            liability={Number(profile?.wallet?.collectedCodLiability || 0)}
            onOpenChange={setCodOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PartnerOverview({ kind, insight }: { kind: PartnerKind; insight: PartnerInsight }) {
  const summary = insight.summary;
  const profile = profileFor(kind, insight.partner);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PartnerMetric label="Orders" value={summary.totalOrders} />
        <PartnerMetric label="Delivered" value={summary.deliveredOrders} tone="emerald" />
        <PartnerMetric label="Gross amount" value={`Rs. ${formatAmount(summary.grossAmount)}`} tone="cyan" />
        <PartnerMetric
          label={kind === "seller" ? "Partner earnings" : "Rider payout"}
          value={`Rs. ${formatAmount(summary.partnerEarnings)}`}
          tone="amber"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailBox label="Available wallet" value={`Rs. ${formatAmount(summary.availableBalance)}`} />
        <DetailBox label="Pending payout" value={`Rs. ${formatAmount(summary.pendingPayoutBalance)}`} />
        <DetailBox label="Lifetime earnings" value={`Rs. ${formatAmount(summary.lifetimeEarnings)}`} />
        <DetailBox
          label={kind === "rider" ? "COD liability" : "Payout methods"}
          value={
            kind === "rider"
              ? `Rs. ${formatAmount(summary.collectedCodLiability || 0)}`
              : `${profile?.payoutMethodsSummary?.verified || 0} verified / ${profile?.payoutMethodsSummary?.pending || 0} pending`
          }
        />
      </div>
      {kind === "seller" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <InventorySummary insight={insight} />
          <ProductPerformanceTable rows={insight.productPerformance || []} />
        </div>
      )}
      {kind === "rider" && <RiderPerformance insight={insight} />}
    </div>
  );
}

function PartnerOrdersTable({
  orders,
  isLoading,
  page,
  totalPages,
  onPage,
}: {
  orders: AdminSubOrder[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (isLoading) return <LoadingState label="Loading orders..." />;
  if (!orders.length) return <EmptyState label="No orders found for this partner." />;

  return (
    <div className="grid gap-3">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Sub-order</TableHead>
                <TableHead className="text-gray-400">Store / Customer</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Rider payout</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{order.subOrderId}</div>
                    <div className="text-xs text-gray-500">{order.parentOrderId?.orderId || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{order.storeId?.name || "Store"}</div>
                    <div className="text-xs text-gray-500">
                      {order.parentOrderId?.shippingAddress?.fullName || "Customer"}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">Rs. {formatAmount(order.payableAmount || 0)}</TableCell>
                  <TableCell>
                    <PartnerStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-gray-300">
                    Rs. {formatAmount(order.delivery?.payoutAmount || 0)}
                  </TableCell>
                  <TableCell className="text-gray-400">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PaginationFooter page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}

function PartnerTransactionsTable({ transactions }: { transactions: PartnerTransaction[] }) {
  if (!transactions.length) return <EmptyState label="No partner transactions found." />;
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="px-4 text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Reference</TableHead>
              <TableHead className="text-gray-400">Note</TableHead>
              <TableHead className="text-gray-400">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={`${transaction.type}-${transaction._id}`} className="border-white/10 hover:bg-white/[0.03]">
                <TableCell className="px-4">
                  <Badge variant="outline" className="border-white/10 text-gray-300">
                    {transaction.type}
                  </Badge>
                  <div className="mt-1 text-xs text-gray-500">{transaction.label}</div>
                </TableCell>
                <TableCell className="font-medium text-white">Rs. {formatAmount(transaction.amount)}</TableCell>
                <TableCell className="text-gray-300">{transaction.status || "-"}</TableCell>
                <TableCell className="text-gray-400">{transaction.referenceId || "-"}</TableCell>
                <TableCell className="max-w-64 truncate text-gray-400">{transaction.note || "-"}</TableCell>
                <TableCell className="text-gray-400">{formatDateTime(transaction.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PartnerReports({ insight }: { insight: PartnerInsight }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ReportTable
        title="Daily report"
        rows={insight.daily}
        columns={["Date", "Orders", "Delivered", "Gross", "Earnings"]}
        render={(row) => [
          row._id,
          row.orders,
          row.deliveredOrders,
          `Rs. ${formatAmount(row.grossAmount)}`,
          `Rs. ${formatAmount(row.partnerEarnings)}`,
        ]}
      />
      <ReportTable
        title="Status breakdown"
        rows={insight.statusBreakdown}
        columns={["Status", "Orders", "Gross", "Earnings"]}
        render={(row) => [
          row._id,
          row.count,
          `Rs. ${formatAmount(row.grossAmount)}`,
          `Rs. ${formatAmount(row.partnerEarnings)}`,
        ]}
      />
    </div>
  );
}

function ReportTable<T>({
  title,
  rows,
  columns,
  render,
}: {
  title: string;
  rows: T[];
  columns: string[];
  render: (row: T) => ExportRow;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!rows.length && <EmptyState label="No report rows found." />}
        {Boolean(rows.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {columns.map((column, index) => (
                  <TableHead key={column} className={index === 0 ? "px-4 text-gray-400" : "text-gray-400"}>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="border-white/10 hover:bg-white/[0.03]">
                  {render(row).map((value, index) => (
                    <TableCell
                      key={`${rowIndex}-${index}`}
                      className={index === 0 ? "px-4 text-sm font-medium text-white" : "text-sm text-gray-300"}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function InventorySummary({ insight }: { insight: PartnerInsight }) {
  const inventory = insight.inventory;
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-base text-white">Inventory</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <DetailBox label="Products" value={inventory?.totalProducts || 0} />
        <DetailBox label="Active products" value={inventory?.activeProducts || 0} />
        <DetailBox label="Total stock" value={inventory?.totalStock || 0} />
        <DetailBox label="Low stock" value={inventory?.lowStockProducts || 0} />
      </CardContent>
    </Card>
  );
}

function ProductPerformanceTable({ rows }: { rows: NonNullable<PartnerInsight["productPerformance"]> }) {
  return (
    <ReportTable
      title="Product performance"
      rows={rows}
      columns={["Product", "SKU", "Qty", "Revenue"]}
      render={(row) => [row.title || row._id, row.sku || "-", row.quantity, `Rs. ${formatAmount(row.revenue)}`]}
    />
  );
}

function RiderPerformance({ insight }: { insight: PartnerInsight }) {
  const performance = insight.riderPerformance;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base text-white">Delivery performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <DetailBox label="Total payout" value={`Rs. ${formatAmount(performance?.totalPayout || 0)}`} />
          <DetailBox label="Distance" value={`${formatAmount(performance?.totalDistanceKm || 0)} km`} />
          <DetailBox label="COD collected" value={`Rs. ${formatAmount(performance?.codCollected || 0)}`} />
          <DetailBox
            label="Bonuses"
            value={`Rs. ${formatAmount(
              (performance?.rainBonus || 0) +
                (performance?.peakBonus || 0) +
                (performance?.festivalBonus || 0) +
                (performance?.nightBonus || 0),
            )}`}
          />
        </CardContent>
      </Card>
      <ReportTable
        title="COD settlements"
        rows={insight.codSettlements || []}
        columns={["Date", "Amount", "Status", "Reference"]}
        render={(row) => [
          formatDate(row.depositedAt || row.createdAt),
          `Rs. ${formatAmount(row.amount)}`,
          row.status,
          row.referenceId || "-",
        ]}
      />
    </div>
  );
}

function RecordPayoutDialog({
  open,
  partner,
  type,
  onOpenChange,
}: {
  open: boolean;
  partner: ManagedPerson;
  type: PartnerType;
  onOpenChange: (open: boolean) => void;
}) {
  const createPayout = useCreatePayout();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [status, setStatus] = useState<PayoutStatus>("PROCESSING");
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createPayout.mutate(
      {
        partnerId: partner._id,
        partnerType: type,
        amount: Number(amount),
        method: optionalValue(method),
        status,
        referenceId: optionalValue(referenceId),
        note: optionalValue(note),
      },
      {
        onSuccess: () => {
          setAmount("");
          setReferenceId("");
          setNote("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payout</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <DetailBox label="Partner" value={`${partner.fullName} / ${type}`} />
          <Input
            type="number"
            min="1"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className={inputClass}
          />
          <select value={method} onChange={(event) => setMethod(event.target.value)} className={selectClass}>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as PayoutStatus)} className={selectClass}>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
          <Input
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
            placeholder="Reference ID"
            className={inputClass}
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Internal note"
            className={textareaClass}
          />
          <DialogFooter className="border-white/10 bg-transparent">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPayout.isPending}>
              <WalletCards className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettleCodDialog({
  open,
  partner,
  liability,
  onOpenChange,
}: {
  open: boolean;
  partner: ManagedPerson;
  liability: number;
  onOpenChange: (open: boolean) => void;
}) {
  const settleCod = useSettleRiderCod();
  const [amount, setAmount] = useState(String(liability || ""));
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    settleCod.mutate(
      {
        riderId: partner._id,
        amount: Number(amount),
        referenceId: optionalValue(referenceId),
        note: optionalValue(note),
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settle COD Liability</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <DetailBox label="Current liability" value={`Rs. ${formatAmount(liability)}`} />
          <Input
            type="number"
            min="1"
            max={liability}
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Deposit amount"
            className={inputClass}
          />
          <Input
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
            placeholder="Reference ID"
            className={inputClass}
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Settlement note"
            className={textareaClass}
          />
          <DialogFooter className="border-white/10 bg-transparent">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={settleCod.isPending}>
              <Coins className="h-4 w-4" />
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PartnerMetric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "emerald" | "cyan" | "amber";
}) {
  const toneClass = {
    slate: "text-white",
    emerald: "text-emerald-200",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
  }[tone];

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
        <div className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function DetailBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function PartnerProfileCell({ kind, profile }: { kind: PartnerKind; profile?: PartnerProfile | null }) {
  if (!profile) return <span className="text-xs text-gray-500">Missing profile</span>;
  if (kind === "seller") {
    return (
      <div className="space-y-1 text-sm">
        <div className="text-white">{profile.businessName || "Business"}</div>
        <div className="text-xs text-gray-500">{profile.mallName || "Independent seller"}</div>
        <div className="text-xs text-gray-500">{profile.store?.name || "Store not configured"}</div>
      </div>
    );
  }
  return (
    <div className="space-y-1 text-sm">
      <div className="text-white">{[profile.vehicleType, profile.vehicleNumber].filter(Boolean).join(" / ") || "Vehicle not set"}</div>
      <div className="text-xs text-gray-500">{profile.licenseNumber || "License not set"}</div>
      <div className="text-xs text-gray-500">{profile.address?.city || "City not set"}</div>
    </div>
  );
}

function PartnerStatusBadge({ status }: { status?: string }) {
  const className =
    status === "APPROVED"
      ? "border-emerald-400/30 text-emerald-300"
      : status === "PENDING"
        ? "border-amber-400/30 text-amber-300"
        : status === "REJECTED"
          ? "border-red-400/30 text-red-300"
          : "border-white/10 text-gray-300";
  return (
    <Badge variant="outline" className={className}>
      {status || "UNKNOWN"}
    </Badge>
  );
}

function profileFor(kind: PartnerKind, person: ManagedPerson) {
  return kind === "seller" ? person.sellerProfile : person.deliveryProfile;
}

function partnerDisplayName(kind: PartnerKind, person: ManagedPerson) {
  if (kind === "seller") return person.sellerProfile?.businessName || person.fullName || person.email;
  return person.fullName || person.email;
}

function cleanListParams(params: AdminListParams) {
  return {
    ...params,
    status: params.status === "ALL" ? undefined : params.status,
    search: params.search || undefined,
  };
}

function summarizePeople(kind: PartnerKind, people: ManagedPerson[]) {
  return people.reduce(
    (summary, person) => {
      const profile = profileFor(kind, person);
      if (profile?.status === "APPROVED") summary.approved += 1;
      summary.availableBalance += Number(profile?.wallet?.availableBalance || 0);
      summary.pendingPayoutBalance += Number(profile?.wallet?.pendingPayoutBalance || 0);
      summary.codLiability += Number(profile?.wallet?.collectedCodLiability || 0);
      return summary;
    },
    { approved: 0, availableBalance: 0, pendingPayoutBalance: 0, codLiability: 0 },
  );
}

function exportPartnerCsv(kind: PartnerKind, insight: PartnerInsight, orders: AdminSubOrder[]) {
  downloadCsv(`${kind}-report-${insight.partner._id}.csv`, buildReportRows(kind, insight, orders));
}

function exportPartnerXlsx(kind: PartnerKind, insight: PartnerInsight, orders: AdminSubOrder[]) {
  downloadXlsx(`${kind}-report-${insight.partner._id}.xlsx`, {
    Summary: summaryRows(kind, insight),
    Orders: orderRows(orders),
    Transactions: transactionRows(insight.transactions),
    Daily: dailyRows(insight),
    Status: statusRows(insight),
    ...(kind === "seller" ? { Products: productRows(insight) } : { COD: codRows(insight) }),
  });
}

function buildReportRows(kind: PartnerKind, insight: PartnerInsight, orders: AdminSubOrder[]): ExportRow[] {
  return [
    ...summaryRows(kind, insight),
    [],
    ["Orders"],
    ...orderRows(orders),
    [],
    ["Transactions"],
    ...transactionRows(insight.transactions),
    [],
    ["Daily Report"],
    ...dailyRows(insight),
    [],
    ["Status Breakdown"],
    ...statusRows(insight),
  ];
}

function summaryRows(kind: PartnerKind, insight: PartnerInsight): ExportRow[] {
  const summary = insight.summary;
  return [
    ["Metric", "Value"],
    ["Partner", partnerDisplayName(kind, insight.partner)],
    ["Email", insight.partner.email],
    ["Total Orders", summary.totalOrders],
    ["Delivered Orders", summary.deliveredOrders],
    ["Cancelled Orders", summary.cancelledOrders],
    ["Gross Amount", summary.grossAmount],
    ["Partner Earnings", summary.partnerEarnings],
    ["Available Wallet", summary.availableBalance],
    ["Pending Payout Balance", summary.pendingPayoutBalance],
    ["Lifetime Earnings", summary.lifetimeEarnings],
    ["COD Liability", summary.collectedCodLiability || 0],
    ["Paid Payout Amount", summary.paidPayoutAmount],
    ["Pending Payout Amount", summary.pendingPayoutAmount],
  ];
}

function orderRows(orders: AdminSubOrder[]): ExportRow[] {
  return [
    ["Sub-order", "Parent order", "Store", "Customer", "Status", "Amount", "Rider", "Rider Payout", "Created"],
    ...orders.map((order) => [
      order.subOrderId,
      order.parentOrderId?.orderId || "",
      order.storeId?.name || "",
      order.parentOrderId?.shippingAddress?.fullName || "",
      order.status,
      order.payableAmount || 0,
      orderRiderName(order),
      order.delivery?.payoutAmount || 0,
      order.createdAt || "",
    ]),
  ];
}

function orderRiderName(order: AdminSubOrder) {
  const rider = order.delivery?.riderId;
  if (!rider) return "";
  return typeof rider === "string" ? rider : rider.fullName || rider._id || "";
}

function transactionRows(transactions: PartnerTransaction[]): ExportRow[] {
  return [
    ["Type", "Label", "Amount", "Gross", "Commission", "Status", "Reference", "Method", "Note", "Date"],
    ...transactions.map((transaction) => [
      transaction.type,
      transaction.label,
      transaction.amount,
      transaction.grossAmount || "",
      transaction.commissionAmount || "",
      transaction.status || "",
      transaction.referenceId || "",
      transaction.method || "",
      transaction.note || "",
      transaction.createdAt || "",
    ]),
  ];
}

function dailyRows(insight: PartnerInsight): ExportRow[] {
  return [
    ["Date", "Orders", "Delivered Orders", "Gross Amount", "Partner Earnings"],
    ...insight.daily.map((row) => [row._id, row.orders, row.deliveredOrders, row.grossAmount, row.partnerEarnings]),
  ];
}

function statusRows(insight: PartnerInsight): ExportRow[] {
  return [
    ["Status", "Orders", "Gross Amount", "Partner Earnings"],
    ...insight.statusBreakdown.map((row) => [row._id, row.count, row.grossAmount, row.partnerEarnings]),
  ];
}

function productRows(insight: PartnerInsight): ExportRow[] {
  return [
    ["Product", "SKU", "Quantity", "Revenue"],
    ...(insight.productPerformance || []).map((row) => [row.title || row._id, row.sku || "", row.quantity, row.revenue]),
  ];
}

function codRows(insight: PartnerInsight): ExportRow[] {
  return [
    ["Date", "Amount", "Status", "Reference", "Note"],
    ...(insight.codSettlements || []).map((row) => [
      row.depositedAt || row.createdAt || "",
      row.amount,
      row.status,
      row.referenceId || "",
      row.note || "",
    ]),
  ];
}
