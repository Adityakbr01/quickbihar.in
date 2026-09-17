"use client";

import { type FormEvent, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  useCreatePayout,
  useReviewPayoutMethod,
  useUpdatePayoutStatus,
} from "@/features/dashboard/hooks/useAdminManagement";
import { inputClass, selectClass, textareaClass } from "./types";
import {
  formatDate,
  formatDateTime,
  formatAmount,
  optionalValue,
  getPartner,
  payoutMethodLabel,
  payoutPartnerName,
  payoutPartnerEmail,
  payoutPartnerId,
} from "./utils";
import {
  PayoutPartnerBadge,
  PayoutStatusBadge,
} from "./badges";
import { DetailItem, MiniMoney, PayoutSummaryCard } from "./cards";
import type {
  ManagedPerson,
  PartnerType,
  Payout,
  PayoutMethod,
  PayoutStatus,
} from "@/features/dashboard/api/adminManagement.api";

export function PayoutsSection({
  partners,
  payouts,
  payoutMethods,
  payoutsLoading,
  payoutMethodsLoading,
}: {
  partners: ManagedPerson[];
  payouts: Payout[];
  payoutMethods: PayoutMethod[];
  payoutsLoading: boolean;
  payoutMethodsLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PayoutStatus | "ALL">("ALL");
  const [type, setType] = useState<PartnerType | "ALL">("ALL");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const summary = useMemo(() => {
    const pendingAmount = payouts
      .filter(
        (payout) =>
          payout.status === "PENDING" || payout.status === "PROCESSING",
      )
      .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
    const paidAmount = payouts
      .filter((payout) => payout.status === "PAID")
      .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
    const failedCount = payouts.filter(
      (payout) => payout.status === "FAILED",
    ).length;
    const walletAvailable = partners.reduce((sum, partner) => {
      const wallet = getPartner(partner)?.profile.wallet;
      return sum + Number(wallet?.availableBalance || 0);
    }, 0);

    return {
      pendingAmount,
      paidAmount,
      failedCount,
      walletAvailable,
      pendingCount: payouts.filter((payout) => payout.status === "PENDING")
        .length,
      processingCount: payouts.filter(
        (payout) => payout.status === "PROCESSING",
      ).length,
      methodCount: payoutMethods.length,
    };
  }, [partners, payoutMethods.length, payouts]);

  const filteredPayouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payouts.filter((payout) => {
      const matchesStatus = status === "ALL" || payout.status === status;
      const matchesType = type === "ALL" || payout.partnerType === type;
      const haystack = [
        payoutPartnerName(payout),
        payoutPartnerEmail(payout),
        payout.partnerType,
        payout.status,
        payout.referenceId,
        payout.method,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [payouts, search, status, type]);

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PayoutSummaryCard
          title="Awaiting payout"
          value={`Rs. ${formatAmount(summary.pendingAmount)}`}
          detail={`${summary.pendingCount} pending, ${summary.processingCount} processing`}
          tone="amber"
        />
        <PayoutSummaryCard
          title="Paid out"
          value={`Rs. ${formatAmount(summary.paidAmount)}`}
          detail={`${payouts.filter((payout) => payout.status === "PAID").length} completed payouts`}
          tone="emerald"
        />
        <PayoutSummaryCard
          title="Wallet available"
          value={`Rs. ${formatAmount(summary.walletAvailable)}`}
          detail={`${partners.length} payout partners`}
          tone="cyan"
        />
        <PayoutSummaryCard
          title="Method reviews"
          value={summary.methodCount}
          detail={
            summary.failedCount
              ? `${summary.failedCount} failed payouts need attention`
              : "No failed payout alerts"
          }
          tone={summary.methodCount ? "amber" : "slate"}
        />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              Manual payout operations
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Record seller or delivery rider payouts with method, reference,
              and internal note.
            </div>
          </div>
          <Button
            onClick={() => setIsRecordOpen(true)}
            disabled={!partners.length}
          >
            <WalletCards className="h-4 w-4" />
            Record Payout
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
          </DialogHeader>
          <PayoutPanel
            partners={partners}
            onCancel={() => setIsRecordOpen(false)}
            onRecorded={() => setIsRecordOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <PayoutMethodReviewPanel
        methods={payoutMethods}
        isLoading={payoutMethodsLoading}
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="gap-3 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base text-white">
              Payout History
            </CardTitle>
            <div className="mt-1 text-xs text-gray-500">
              Showing {filteredPayouts.length} of {payouts.length} payouts
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_130px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search partner, ref, method"
              className={inputClass}
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PayoutStatus | "ALL")
              }
              className={selectClass}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as PartnerType | "ALL")
              }
              className={selectClass}
            >
              <option value="ALL">All partners</option>
              <option value="SELLER">Sellers</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <PayoutTable
            payouts={filteredPayouts}
            isLoading={payoutsLoading}
            isFiltered={Boolean(search || status !== "ALL" || type !== "ALL")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutPanel({
  partners,
  onCancel,
  onRecorded,
}: {
  partners: ManagedPerson[];
  onCancel: () => void;
  onRecorded: () => void;
}) {
  const createPayout = useCreatePayout();
  const [partner, setPartner] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PayoutStatus>("PROCESSING");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");
  const selectedPartner = useMemo(
    () =>
      partners.find((person) => {
        const current = getPartner(person);
        return current ? `${person._id}|${current.type}` === partner : false;
      }),
    [partner, partners],
  );
  const selectedProfile = selectedPartner ? getPartner(selectedPartner) : null;
  const selectedWallet = selectedProfile?.profile.wallet;
  const selectedMethodSummary = selectedProfile?.profile.payoutMethodsSummary;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const [partnerId, partnerType] = partner.split("|") as [
      string,
      PartnerType,
    ];
    if (!partnerId || !partnerType) return;

    createPayout.mutate(
      {
        partnerId,
        partnerType,
        amount: Number(amount),
        method: optionalValue(method),
        status,
        referenceId: optionalValue(referenceId),
        note: optionalValue(note),
      },
      {
        onSuccess: () => {
          setAmount("");
          setStatus("PROCESSING");
          setMethod("BANK_TRANSFER");
          setReferenceId("");
          setNote("");
          onRecorded();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <select
        value={partner}
        onChange={(event) => setPartner(event.target.value)}
        required
        className={selectClass}
      >
        <option value="">Partner</option>
        {partners.map((person) => {
          const current = getPartner(person);
          if (!current) return null;
          const label =
            current.type === "SELLER"
              ? person.sellerProfile?.businessName || person.fullName
              : person.fullName;
          return (
            <option key={person._id} value={`${person._id}|${current.type}`}>
              {label} - {current.type}
            </option>
          );
        })}
      </select>
      {selectedPartner && (
        <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">
                {selectedPartner.fullName}
              </div>
              <div className="text-xs text-gray-500">
                {selectedPartner.email}
              </div>
            </div>
            <PayoutPartnerBadge type={selectedProfile?.type || "SELLER"} />
          </div>
          <div className={cn("grid gap-2", selectedProfile?.type === "DELIVERY" ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
            <MiniMoney
              label="Available"
              value={selectedWallet?.availableBalance}
            />
            <MiniMoney
              label="Pending"
              value={selectedWallet?.pendingPayoutBalance}
            />
            <MiniMoney
              label="Lifetime"
              value={selectedWallet?.lifetimeEarnings}
            />
            {selectedProfile?.type === "DELIVERY" && (
              <MiniMoney
                label="COD Liability"
                value={selectedWallet?.collectedCodLiability || 0}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>
              Methods: {selectedMethodSummary?.verified || 0} verified
            </span>
            <span className="text-gray-600">/</span>
            <span>{selectedMethodSummary?.pending || 0} pending</span>
            {Number(selectedWallet?.availableBalance || 0) > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto h-7 border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() =>
                  setAmount(String(selectedWallet?.availableBalance || ""))
                }
              >
                Use balance
              </Button>
            )}
          </div>
        </div>
      )}
      <Input
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Amount"
        type="number"
        min="1"
        required
        className={inputClass}
      />
      <select
        value={method}
        onChange={(event) => setMethod(event.target.value)}
        className={selectClass}
      >
        <option value="BANK_TRANSFER">Bank transfer</option>
        <option value="UPI">UPI</option>
        <option value="CASH">Cash</option>
        <option value="OTHER">Other</option>
      </select>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as PayoutStatus)}
        className={selectClass}
      >
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
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={createPayout.isPending || !partners.length}
        >
          <WalletCards className="h-4 w-4" />
          Record Payout
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

function PayoutMethodReviewPanel({
  methods,
  isLoading,
}: {
  methods: PayoutMethod[];
  isLoading: boolean;
}) {
  const reviewPayoutMethod = useReviewPayoutMethod();
  const rejectMethod = (method: PayoutMethod) => {
    const reason = window.prompt("Reason for rejecting this payout method?");
    if (reason === null) return;
    reviewPayoutMethod.mutate({
      sellerId: method.sellerId,
      deliveryId: method.deliveryId,
      methodId: method._id,
      status: "REJECTED",
      reason: optionalValue(reason || ""),
    });
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-2 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Verify Payout Methods
          </CardTitle>
          <div className="mt-1 text-xs text-gray-500">
            {methods.length} waiting for admin review
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            methods.length
              ? "border-amber-400/30 text-amber-300"
              : "border-emerald-400/30 text-emerald-300"
          }
        >
          {methods.length ? "Action needed" : "Clear"}
        </Badge>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="px-4 py-8 text-sm text-gray-400">
            Loading payout methods...
          </div>
        )}
        {!isLoading && !methods.length && (
          <div className="px-4 py-8 text-sm text-gray-400">
            No pending payout methods. New seller and rider methods will appear
            here for approval.
          </div>
        )}
        {!isLoading && Boolean(methods.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Partner</TableHead>
                <TableHead className="text-gray-400">Method</TableHead>
                <TableHead className="text-gray-400">Submitted</TableHead>
                <TableHead className="text-right text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow
                  key={method._id}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  <TableCell className="px-4">
                    <div className="font-medium text-white">
                      {method.businessName ||
                        method.sellerName ||
                        method.riderName ||
                        "Partner"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {method.sellerEmail || method.riderEmail}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <PayoutPartnerBadge
                        type={
                          method.partnerType ||
                          (method.deliveryId ? "DELIVERY" : "SELLER")
                        }
                      />
                      {method.isDefault && (
                        <Badge
                          variant="outline"
                          className="border-cyan-400/30 text-cyan-300"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{method.type}</div>
                    <div className="text-xs text-gray-500">
                      {payoutMethodLabel(method)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {formatDate(method.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() =>
                          reviewPayoutMethod.mutate({
                            sellerId: method.sellerId,
                            deliveryId: method.deliveryId,
                            methodId: method._id,
                            status: "VERIFIED",
                          })
                        }
                        disabled={reviewPayoutMethod.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMethod(method)}
                        disabled={reviewPayoutMethod.isPending}
                      >
                        Reject
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
  );
}

function PayoutTable({
  payouts,
  isLoading,
  isFiltered,
}: {
  payouts: Payout[];
  isLoading: boolean;
  isFiltered: boolean;
}) {
  const updatePayoutStatus = useUpdatePayoutStatus();
  const [viewingPayout, setViewingPayout] = useState<Payout | null>(null);
  const [payingPayout, setPayingPayout] = useState<Payout | null>(null);
  const updateStatus = (payout: Payout, status: PayoutStatus) => {
    const noteValue =
      status === "FAILED"
        ? window.prompt("Failure note?", payout.note || "")
        : undefined;
    if (noteValue === null) return;

    const note = noteValue === undefined ? undefined : optionalValue(noteValue);
    updatePayoutStatus.mutate({ payoutId: payout._id, status, note });
  };

  if (isLoading)
    return (
      <div className="px-4 py-8 text-sm text-gray-400">Loading payouts...</div>
    );
  if (!payouts.length)
    return (
      <div className="px-4 py-8 text-sm text-gray-400">
        {isFiltered
          ? "No payouts match these filters."
          : "No payouts recorded."}
      </div>
    );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="px-4 text-gray-400">Partner</TableHead>
            <TableHead className="text-gray-400">Amount</TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Reference</TableHead>
            <TableHead className="text-gray-400">Method</TableHead>
            <TableHead className="text-gray-400">Created</TableHead>
            <TableHead className="text-right text-gray-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow
              key={payout._id}
              className="border-white/10 hover:bg-white/[0.03]"
            >
              <TableCell className="px-4">
                <div className="font-medium text-white">
                  {payoutPartnerName(payout)}
                </div>
                <div className="text-xs text-gray-500">
                  {payoutPartnerEmail(payout)}
                </div>
                <div className="mt-1">
                  <PayoutPartnerBadge type={payout.partnerType} />
                </div>
              </TableCell>
              <TableCell className="text-white">
                Rs. {formatAmount(payout.amount)}
              </TableCell>
              <TableCell>
                <PayoutStatusBadge status={payout.status} />
              </TableCell>
              <TableCell className="text-gray-400">
                {payout.referenceId || "-"}
              </TableCell>
              <TableCell className="text-gray-400">
                {payout.method || "-"}
              </TableCell>
              <TableCell className="text-gray-400">
                {formatDate(payout.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => setViewingPayout(payout)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  {payout.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      disabled={updatePayoutStatus.isPending}
                      onClick={() => updateStatus(payout, "PROCESSING")}
                    >
                      Start
                    </Button>
                  )}
                  {(payout.status === "PENDING" ||
                    payout.status === "PROCESSING") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                        disabled={updatePayoutStatus.isPending}
                        onClick={() => setPayingPayout(payout)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20"
                        disabled={updatePayoutStatus.isPending}
                        onClick={() => updateStatus(payout, "FAILED")}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Fail
                      </Button>
                    </>
                  )}
                  {payout.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      disabled={updatePayoutStatus.isPending}
                      onClick={() => updateStatus(payout, "PROCESSING")}
                    >
                      Retry
                    </Button>
                  )}
                  {payout.status === "PAID" && (
                    <span className="text-xs text-gray-500">Settled</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {viewingPayout && (
        <PayoutDetailDialog
          payout={viewingPayout}
          onOpenChange={(open) => !open && setViewingPayout(null)}
        />
      )}
      {payingPayout && (
        <PayoutPaidDialog
          payout={payingPayout}
          isPending={updatePayoutStatus.isPending}
          onOpenChange={(open) => !open && setPayingPayout(null)}
          onSubmit={(payout, referenceId, note) => {
            updatePayoutStatus.mutate(
              {
                payoutId: payout._id,
                status: "PAID",
                referenceId: optionalValue(referenceId),
                note: optionalValue(note),
              },
              { onSuccess: () => setPayingPayout(null) },
            );
          }}
        />
      )}
    </>
  );
}

function PayoutDetailDialog({
  payout,
  onOpenChange,
}: {
  payout: Payout;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payout Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div>
              <div className="text-sm font-medium text-white">
                {payoutPartnerName(payout)}
              </div>
              <div className="text-xs text-gray-500">
                {payoutPartnerEmail(payout) || "No email"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PayoutPartnerBadge type={payout.partnerType} />
              <PayoutStatusBadge status={payout.status} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Payout ID" value={payout._id} />
            <DetailItem
              label="Partner ID"
              value={payoutPartnerId(payout) || "-"}
            />
            <DetailItem
              label="Amount"
              value={`Rs. ${formatAmount(payout.amount)}`}
            />
            <DetailItem
              label="Status"
              value={<PayoutStatusBadge status={payout.status} />}
            />
            <DetailItem label="Method" value={payout.method || "-"} />
            <DetailItem
              label="Method ID"
              value={payout.payoutMethodId || "-"}
            />
            <DetailItem label="Reference" value={payout.referenceId || "-"} />
            <DetailItem
              label="Created"
              value={formatDateTime(payout.createdAt)}
            />
          </div>
          <DetailItem label="Admin Note" value={payout.note || "-"} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayoutPaidDialog({
  payout,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  payout: Payout;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payout: Payout, referenceId: string, note: string) => void;
}) {
  const [referenceId, setReferenceId] = useState(payout.referenceId || "");
  const [note, setNote] = useState(payout.note || "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(payout, referenceId, note);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mark Payout Paid</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
            <div className="text-xs font-medium uppercase text-emerald-200">
              Settlement amount
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              Rs. {formatAmount(payout.amount)}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Partner" value={payoutPartnerName(payout)} />
            <DetailItem
              label="Email"
              value={payoutPartnerEmail(payout) || "-"}
            />
            <DetailItem
              label="Partner Type"
              value={<PayoutPartnerBadge type={payout.partnerType} />}
            />
            <DetailItem
              label="Current Status"
              value={<PayoutStatusBadge status={payout.status} />}
            />
            <DetailItem label="Method" value={payout.method || "-"} />
            <DetailItem
              label="Created"
              value={formatDateTime(payout.createdAt)}
            />
          </div>
          <Input
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
            placeholder="Payment reference ID"
            className={inputClass}
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Settlement note"
            className={textareaClass}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Mark Paid
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
