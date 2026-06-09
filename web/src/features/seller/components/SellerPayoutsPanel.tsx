"use client";

import React, { type FormEvent, useMemo } from "react";
import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SellerSetupStatus } from "@/features/seller/api/sellerPanel.api";
import type { SellerPayoutMethodPayload } from "@/features/seller/api/sellerPanel.api";
import {
  useSellerSetupStatusV2,
  useSellerPayouts,
  useSellerPayoutMutations,
} from "../hooks/useSellerManagement";
import {
  StatusTile,
  StatusBadge,
  Field,
  SimpleTable,
  EmptyState,
  labelClass,
  selectClass,
  formatAmount,
  formatDate,
  text,
  numberValue,
  payoutMethodLabel,
} from "./SellerHelpers";

export function SellerPayoutsPanel({ setup }: { setup?: SellerSetupStatus }) {
  const setupQuery = useSellerSetupStatusV2();
  const payoutsQuery = useSellerPayouts();
  const payoutMutations = useSellerPayoutMutations();
  const currentSetup = setup || setupQuery.data;
  const wallet = currentSetup?.seller.wallet;
  const rawMethods = currentSetup?.seller.payoutMethods;
  const methods = useMemo(() => rawMethods || [], [rawMethods]);
  const verifiedMethods = useMemo(
    () => methods.filter((method) => method.status === "VERIFIED"),
    [methods]
  );

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
        <CardContent className="grid gap-3 pt-4">
          <StatusTile
            title="Available"
            label={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`}
            active
          />
          <StatusTile
            title="Pending"
            label={`Rs. ${formatAmount(wallet?.pendingPayoutBalance || 0)}`}
            active={Boolean(wallet?.pendingPayoutBalance)}
          />
          <StatusTile title="Lifetime" label={`Rs. ${formatAmount(wallet?.lifetimeEarnings || 0)}`} active />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Payout Methods</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2">
          {methods.length ? (
            methods.map((method) => (
              <div key={method._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{method.type}</div>
                    <div className="text-xs text-gray-500">{payoutMethodLabel(method)}</div>
                  </div>
                  <StatusBadge label={method.status} />
                </div>
                {method.status === "VERIFIED" && !method.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => payoutMutations.setDefault.mutate(method._id)}
                  >
                    Set Default
                  </Button>
                )}
              </div>
            ))
          ) : (
            <EmptyState label="No payout methods." />
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Add Method</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
        <CardContent className="grid gap-4 pt-4">
          <form onSubmit={submitPayout} className="grid gap-3">
            <label className={labelClass}>
              Method
              <select name="payoutMethodId" required className={selectClass}>
                <option value="">Verified method</option>
                {verifiedMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.type} - {payoutMethodLabel(method)}
                  </option>
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
            rows={(payoutsQuery.data?.payouts as Array<Record<string, unknown>> | undefined || []).map(
              (payout) => [
                `Rs. ${formatAmount(Number(payout.amount || 0))}`,
                <StatusBadge key={String(payout._id)} label={String(payout.status || "PENDING")} />,
                String(payout.method || "-"),
                formatDate(String(payout.createdAt || "")),
              ]
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
