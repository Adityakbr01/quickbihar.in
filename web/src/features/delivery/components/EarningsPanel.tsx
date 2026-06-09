import { FormEvent } from "react";
import { WalletCards, CheckCircle2, CreditCard, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DeliveryEarningsResponse,
  DeliveryPayout,
  DeliveryPayoutMethod,
  DeliveryPayoutStatus,
  DeliveryStatus,
} from "@/features/delivery/api/delivery.api";
import {
  Metric,
  ProfileLine,
  EmptyState,
  selectClass,
  inputClass,
  textareaClass,
  formatAmount,
  formatDate,
  text,
  optionalText,
  todayInputValue,
} from "./DeliveryHelpers";
import { cn } from "@/lib/utils";

type LedgerItem = {
  _id: string;
  orderId: string;
  amount: number;
  creditedAt?: string;
  deliveredAt?: string;
  customerName?: string;
  status?: DeliveryStatus;
};

type TimelineItemType = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  at?: string;
  actor: string;
  location: string;
  amount?: number;
  detail?: string;
  tone: "cyan" | "emerald" | "amber" | "red" | "slate";
};

export function EarningsPanel({
  earnings,
  payouts,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  loading,
  mutations,
}: {
  earnings: DeliveryEarningsResponse | undefined;
  payouts:
    | {
        payouts: DeliveryPayout[];
        payoutMethods: DeliveryPayoutMethod[];
        wallet: { availableBalance: number; pendingPayoutBalance: number; lifetimeEarnings: number };
      }
    | undefined;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  loading: boolean;
  mutations: {
    addMethod: { mutate: (payload: any) => void; isPending: boolean };
    setDefault: { mutate: (id: string) => void; isPending: boolean };
    request: { mutate: (payload: any) => void; isPending: boolean };
  };
}) {
  const verifiedMethods = (payouts?.payoutMethods || []).filter((method) => method.status === "VERIFIED");
  const payoutList = payouts?.payouts || [];
  const filteredPayoutList = payoutList.filter((payout) => dateInRange(payoutTimelineDate(payout), dateFrom, dateTo));
  const pendingPayouts = filteredPayoutList.filter((payout) => payout.status === "PENDING" || payout.status === "PROCESSING");
  const paidPayouts = filteredPayoutList.filter((payout) => payout.status === "PAID");
  const failedPayouts = filteredPayoutList.filter((payout) => payout.status === "FAILED");
  const timeline = buildEarningsTimeline({
    ledger: earnings?.ledger || [],
    payouts: filteredPayoutList,
  });

  const submitMethod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") || "UPI") as "BANK" | "UPI";
    if (type === "UPI") {
      mutations.addMethod.mutate({ type, label: optionalText(form, "label"), upi: { upiId: text(form, "upiId") } });
      event.currentTarget.reset();
      return;
    }
    mutations.addMethod.mutate({
      type,
      label: optionalText(form, "label"),
      bank: {
        accountHolderName: text(form, "accountHolderName"),
        accountNumber: text(form, "accountNumber"),
        ifsc: text(form, "ifsc"),
        bankName: text(form, "bankName"),
      },
    });
    event.currentTarget.reset();
  };

  const submitPayout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutations.request.mutate({
      amount: Number(form.get("amount") || 0),
      payoutMethodId: text(form, "payoutMethodId"),
      note: optionalText(form, "note"),
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-4">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-white">Date filter</div>
              <div className="mt-1 text-xs text-gray-500">
                Timeline and ledger show credit/debit entries for the selected date range.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="Date From"
                className={cn(inputClass, "w-36")}
              />
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                placeholder="Date To"
                className={cn(inputClass, "w-36")}
              />
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  const today = todayInputValue();
                  setDateFrom(today);
                  setDateTo(today);
                }}
              >
                Today
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Metric
            title="Available"
            value={`Rs. ${formatAmount(payouts?.wallet.availableBalance || earnings?.wallet.availableBalance || 0)}`}
            icon={<WalletCards className="h-4 w-4" />}
          />
          <Metric
            title="Pending"
            value={`Rs. ${formatAmount(payouts?.wallet.pendingPayoutBalance || earnings?.wallet.pendingPayoutBalance || 0)}`}
            icon={<WalletCards className="h-4 w-4" />}
          />
          <Metric
            title="Credited"
            value={`Rs. ${formatAmount(earnings?.totalCredited || 0)}`}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <Metric title="Paid Requests" value={paidPayouts.length} icon={<CheckCircle2 className="h-4 w-4" />} />
          <Metric title="Pending Requests" value={pendingPayouts.length} icon={<WalletCards className="h-4 w-4" />} />
        </section>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <WalletCards className="h-4 w-4 text-cyan-300" />
                Earnings Ledger
              </CardTitle>
              <div className="mt-1 text-xs text-gray-500">
                Order-wise credited rider payouts with delivered and credited times.
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-400/30 text-emerald-300">
              Rs. {formatAmount(earnings?.totalCredited || 0)} credited
            </Badge>
          </CardHeader>
          <CardContent className="px-0">
            {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading earnings...</div>}
            {!loading && !(earnings?.ledger || []).length && <div className="px-4 py-10 text-sm text-gray-400">No credited earnings yet.</div>}
            {!loading && Boolean((earnings?.ledger || []).length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Order</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Delivered</TableHead>
                    <TableHead className="text-gray-400">Credited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings?.ledger.map((item) => (
                    <TableRow key={item._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4 font-medium text-white">{item.orderId}</TableCell>
                      <TableCell className="text-gray-300">{item.customerName || "-"}</TableCell>
                      <TableCell className="text-white">Rs. {formatAmount(item.amount)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(item.deliveredAt)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(item.creditedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <History className="h-4 w-4 text-cyan-300" />
                Full Earnings Timeline
              </CardTitle>
              <div className="mt-1 text-xs text-gray-500">Only wallet credits and debits for the selected date range.</div>
            </div>
            <Badge variant="outline" className="border-white/10 text-gray-300">
              {timeline.length} events
            </Badge>
          </CardHeader>
          <CardContent>
            {loading && <div className="py-10 text-sm text-gray-400">Loading timeline...</div>}
            {!loading && !timeline.length && <EmptyState label="No credit or debit entries for this date range." />}
            {!loading && Boolean(timeline.length) && (
              <div className="grid gap-3">
                {timeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Payout Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading payouts...</div>}
            {!loading && !filteredPayoutList.length && (
              <div className="px-4 py-10 text-sm text-gray-400">No payout requests in this date range.</div>
            )}
            {!loading && Boolean(filteredPayoutList.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Requested</TableHead>
                    <TableHead className="text-gray-400">Paid/Updated</TableHead>
                    <TableHead className="text-gray-400">By</TableHead>
                    <TableHead className="text-gray-400">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayoutList.map((payout) => (
                    <TableRow key={payout._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4 text-white">Rs. {formatAmount(payout.amount)}</TableCell>
                      <TableCell>
                        <PayoutStatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(payout.createdAt)}</TableCell>
                      <TableCell className="text-gray-400">
                        {formatDate(payout.processedAt || payout.updatedAt)}
                      </TableCell>
                      <TableCell className="text-gray-400">{payoutProcessedBy(payout)}</TableCell>
                      <TableCell className="text-gray-400">{payout.referenceId || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Payout Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <ProfileLine label="Pending requests" value={String(pendingPayouts.length)} />
            <ProfileLine label="Paid requests" value={String(paidPayouts.length)} />
            <ProfileLine label="Failed requests" value={String(failedPayouts.length)} />
            <ProfileLine
              label="Pending amount"
              value={`Rs. ${formatAmount(pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0))}`}
            />
            <ProfileLine
              label="Paid amount"
              value={`Rs. ${formatAmount(paidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0))}`}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <CreditCard className="h-4 w-4 text-cyan-300" />
              Payout Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              {(payouts?.payoutMethods || []).length ? (
                payouts?.payoutMethods.map((method) => (
                  <PayoutMethodRow
                    key={method._id}
                    method={method}
                    onDefault={() => mutations.setDefault.mutate(method._id)}
                    isPending={mutations.setDefault.isPending}
                  />
                ))
              ) : (
                <EmptyState label="No payout methods yet." />
              )}
            </div>
            <form onSubmit={submitMethod} className="grid gap-3">
              <select name="type" className={selectClass}>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
              <Input name="label" placeholder="Label" className={inputClass} />
              <Input name="upiId" placeholder="UPI ID" className={inputClass} />
              <Input name="accountHolderName" placeholder="Account holder" className={inputClass} />
              <Input name="accountNumber" placeholder="Account number" className={inputClass} />
              <Input name="ifsc" placeholder="IFSC" className={inputClass} />
              <Input name="bankName" placeholder="Bank name" className={inputClass} />
              <Button type="submit" disabled={mutations.addMethod.isPending}>
                <CreditCard className="h-4 w-4" />
                Add Method
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Request Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPayout} className="grid gap-3">
              <select name="payoutMethodId" required className={selectClass}>
                <option value="">Verified method</option>
                {verifiedMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.displayName || method.label || method.type}
                  </option>
                ))}
              </select>
              <Input name="amount" type="number" min="1" placeholder="Amount" required className={inputClass} />
              <textarea name="note" placeholder="Note" className={textareaClass} />
              <Button type="submit" disabled={mutations.request.isPending || !verifiedMethods.length}>
                <WalletCards className="h-4 w-4" />
                Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayoutMethodRow({
  method,
  onDefault,
  isPending,
}: {
  method: DeliveryPayoutMethod;
  onDefault: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{method.displayName || method.label || method.type}</div>
          <div className="text-xs text-gray-500">{payoutMethodName(method)}</div>
        </div>
        <MethodStatusBadge status={method.status} />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-gray-400">
        <div>Submitted: {formatDate(method.createdAt)}</div>
        {method.verifiedAt && <div>Verified: {formatDate(method.verifiedAt)}</div>}
        {method.rejectionReason && <div className="text-red-300">Rejected: {method.rejectionReason}</div>}
      </div>
      {method.status === "VERIFIED" && !method.isDefault && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDefault}
          disabled={isPending}
          className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Set default
        </Button>
      )}
      {method.isDefault && <div className="mt-2 text-xs text-cyan-300">Default method</div>}
    </div>
  );
}

function TimelineItem({ item }: { item: TimelineItemType }) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto]">
      <div className="flex gap-3">
        <div className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", timelineDotClass(item.tone))} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-white">{item.title}</div>
            <TimelineStatusBadge label={item.status} tone={item.tone} />
          </div>
          <div className="mt-1 text-sm text-gray-400">{item.subtitle}</div>
          <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-3">
            <span>When: {formatDate(item.at)}</span>
            <span>Who: {item.actor}</span>
            <span>Where: {item.location}</span>
          </div>
          {item.detail && <div className="mt-2 text-xs text-gray-400">{item.detail}</div>}
        </div>
      </div>
      {typeof item.amount === "number" && (
        <div className="text-right text-sm font-semibold text-white">Rs. {formatAmount(item.amount)}</div>
      )}
    </div>
  );
}

function buildEarningsTimeline({
  ledger,
  payouts,
}: {
  ledger: LedgerItem[];
  payouts: DeliveryPayout[];
}): TimelineItemType[] {
  const items: TimelineItemType[] = [];

  ledger.forEach((entry) => {
    items.push({
      id: `credit-${entry._id}`,
      title: "Credit to wallet",
      subtitle: `${entry.orderId} · ${entry.customerName || "Customer"}`,
      status: "CREDITED",
      at: entry.creditedAt || entry.deliveredAt,
      actor: "QuickBihar wallet",
      location: "Available balance",
      amount: entry.amount,
      detail: entry.deliveredAt ? `Delivered at ${formatDate(entry.deliveredAt)}` : undefined,
      tone: "emerald",
    });
  });

  payouts.forEach((payout) => {
    const isTerminal = payout.status === "PAID" || payout.status === "FAILED";
    items.push({
      id: `payout-${payout._id}-${payout.status}`,
      title: debitTitle(payout.status),
      subtitle: `${payout.method || "Payout method"} request`,
      status: debitStatusLabel(payout.status),
      at: isTerminal ? payout.processedAt || payout.updatedAt || payout.createdAt : payout.createdAt,
      actor: isTerminal ? payoutProcessedBy(payout) : "You",
      location: payout.status === "PENDING" ? "Admin payout queue" : payout.method || "Payout rail",
      amount: payout.amount,
      detail:
        [
          payout.createdAt ? `Requested ${formatDate(payout.createdAt)}` : undefined,
          payout.referenceId ? `Reference ${payout.referenceId}` : undefined,
          payout.note,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      tone: payoutTone(payout.status),
    });
  });

  return items.sort((first, second) => timeValue(second.at) - timeValue(first.at)).slice(0, 120);
}

function PayoutStatusBadge({ status }: { status: DeliveryPayoutStatus }) {
  return <TimelineStatusBadge label={status} tone={payoutTone(status)} />;
}

function MethodStatusBadge({ status }: { status: DeliveryPayoutMethod["status"] }) {
  const tone = status === "VERIFIED" ? "emerald" : status === "REJECTED" ? "red" : "amber";
  return <TimelineStatusBadge label={status.replace(/_/g, " ")} tone={tone} />;
}

function TimelineStatusBadge({ label, tone }: { label: string; tone: TimelineItemType["tone"] }) {
  return (
    <Badge variant="outline" className={timelineBadgeClass(tone)}>
      {label.replace(/_/g, " ")}
    </Badge>
  );
}

function timelineBadgeClass(tone: TimelineItemType["tone"]) {
  if (tone === "emerald") return "border-emerald-400/30 text-emerald-300";
  if (tone === "amber") return "border-amber-400/30 text-amber-300";
  if (tone === "red") return "border-red-400/30 text-red-300";
  if (tone === "cyan") return "border-cyan-400/30 text-cyan-300";
  return "border-white/10 text-gray-300";
}

function timelineDotClass(tone: TimelineItemType["tone"]) {
  if (tone === "emerald") return "bg-emerald-300";
  if (tone === "amber") return "bg-amber-300";
  if (tone === "red") return "bg-red-300";
  if (tone === "cyan") return "bg-cyan-300";
  return "bg-gray-400";
}

function payoutTone(status: DeliveryPayoutStatus): TimelineItemType["tone"] {
  if (status === "PAID") return "emerald";
  if (status === "FAILED") return "red";
  if (status === "PENDING") return "amber";
  return "cyan";
}

function debitTitle(status: DeliveryPayoutStatus) {
  if (status === "PAID") return "Debit paid";
  if (status === "FAILED") return "Debit failed";
  if (status === "PROCESSING") return "Debit processing";
  return "Debit requested";
}

function debitStatusLabel(status: DeliveryPayoutStatus) {
  if (status === "PAID") return "DEBIT PAID";
  if (status === "FAILED") return "DEBIT FAILED";
  if (status === "PROCESSING") return "DEBIT PROCESSING";
  return "DEBIT PENDING";
}

function payoutMethodName(method: DeliveryPayoutMethod) {
  if (method.type === "UPI") return method.upi?.upiId || method.displayName || method.label || "UPI";
  const account = method.bank?.accountNumber ? `A/C ${method.bank.accountNumber.slice(-4)}` : undefined;
  return [method.bank?.bankName, account].filter(Boolean).join(" · ") || method.displayName || method.label || "Bank";
}

function payoutProcessedBy(payout: DeliveryPayout) {
  if (typeof payout.processedBy === "object" && payout.processedBy)
    return payout.processedBy.fullName || payout.processedBy.email || "Admin";
  if (typeof payout.processedBy === "string" && payout.processedBy) return "Admin";
  return payout.status === "PAID" || payout.status === "FAILED" ? "Admin" : "You";
}

function timeValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function payoutTimelineDate(payout: DeliveryPayout) {
  if (payout.status === "PAID" || payout.status === "FAILED") return payout.processedAt || payout.updatedAt || payout.createdAt;
  return payout.createdAt;
}

function dateInRange(value?: string, dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return true;
  if (!value) return false;
  const current = startOfLocalDay(value);
  if (!current) return false;
  const from = dateFrom ? startOfDateInput(dateFrom) : undefined;
  const to = dateTo ? startOfDateInput(dateTo) : undefined;
  if (from && current < from) return false;
  if (to && current > to) return false;
  return true;
}

function startOfLocalDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day).getTime();
}
