import React from "react";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";
import type {
  RiderEarningsResponse,
  RiderPayoutMethod,
  RiderPayoutsResponse,
  RiderWallet,
} from "../../api/delivery.api";
import { formatDate, money, payoutMethodName } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";
import { EmptyCard, SectionTitle, StatusPill, SummaryTile } from "./RiderShared";
import { cn } from "@/src/lib/utils";

const riderInputChrome = (theme: Theme) => ({
  containerStyle: { marginBottom: 0 },
  inputContainerStyle: {
    backgroundColor: theme.background,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
  },
  style: { fontSize: 15, color: theme.text },
});

export function EarningsPanel({
  styles,
  theme,
  earnings,
  payouts,
  wallet,
  payoutRequestMethods,
  earningsDateFrom,
  earningsDateTo,
  payoutType,
  methodLabel,
  upiId,
  accountHolderName,
  accountNumber,
  ifsc,
  bankName,
  requestAmount,
  requestMethodId,
  requestNote,
  busy,
  onEarningsDateFromChange,
  onEarningsDateToChange,
  onPayoutTypeChange,
  onMethodLabelChange,
  onUpiIdChange,
  onAccountHolderNameChange,
  onAccountNumberChange,
  onIfscChange,
  onBankNameChange,
  onRequestAmountChange,
  onRequestMethodIdChange,
  onRequestNoteChange,
  onSubmitPayoutMethod,
  onRequestPayout,
  onSetDefault,
}: {
  styles: RiderStyles;
  theme: Theme;
  earnings: RiderEarningsResponse | null;
  payouts: RiderPayoutsResponse | null;
  wallet?: RiderWallet;
  payoutRequestMethods: RiderPayoutMethod[];
  earningsDateFrom: string;
  earningsDateTo: string;
  payoutType: "UPI" | "BANK";
  methodLabel: string;
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  requestAmount: string;
  requestMethodId: string;
  requestNote: string;
  busy: boolean;
  onEarningsDateFromChange: (date: string) => void;
  onEarningsDateToChange: (date: string) => void;
  onPayoutTypeChange: (type: "UPI" | "BANK") => void;
  onMethodLabelChange: (value: string) => void;
  onUpiIdChange: (value: string) => void;
  onAccountHolderNameChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onIfscChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onRequestAmountChange: (value: string) => void;
  onRequestMethodIdChange: (value: string) => void;
  onRequestNoteChange: (value: string) => void;
  onSubmitPayoutMethod: () => void;
  onRequestPayout: () => void;
  onSetDefault: (methodId: string) => void;
}) {
  void styles;
  const verifiedMethods = payoutRequestMethods.filter((method) => method.status === "VERIFIED");
  const inputChrome = riderInputChrome(theme);

  return (
    <div className="flex flex-col gap-3.5">
      <SectionTitle styles={styles} title="Earnings" meta={`${earnings?.ledger?.length || 0} ledger entries`} />
      <div className="flex flex-row gap-2.5">
        <TextInput
          {...inputChrome}
          value={earningsDateFrom}
          onChangeText={onEarningsDateFromChange}
          placeholder="From YYYY-MM-DD"
          placeholderTextColor={theme.secondaryText}
          containerStyle={{ marginBottom: 0, flex: 1 }}
        />
        <TextInput
          {...inputChrome}
          value={earningsDateTo}
          onChangeText={onEarningsDateToChange}
          placeholder="To YYYY-MM-DD"
          placeholderTextColor={theme.secondaryText}
          containerStyle={{ marginBottom: 0, flex: 1 }}
        />
      </div>
      <div className="flex flex-row gap-2.5">
        <SummaryTile styles={styles} label="Available" value={money(wallet?.availableBalance)} />
        <SummaryTile styles={styles} label="Pending" value={money(wallet?.pendingPayoutBalance)} />
        <SummaryTile styles={styles} label="Credited" value={money(earnings?.totalCredited)} />
      </div>

      <SectionTitle styles={styles} title="Earnings Ledger" meta="" />
      {(earnings?.ledger || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={Wallet} label="No credited earnings in this date range." />
      ) : (
        (earnings?.ledger || []).map((entry) => (
          <div
            key={entry._id}
            className="flex flex-col gap-2 rounded-2xl border p-3.5"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div className="flex flex-row items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: theme.text }}>
                  {entry.orderId}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {entry.customerName || "Customer"} - {formatDate(entry.creditedAt || entry.deliveredAt)}
                </span>
              </div>
              <span className="text-[17px] font-black" style={{ color: theme.primary }}>
                {money(entry.amount)}
              </span>
            </div>
          </div>
        ))
      )}

      <SectionTitle styles={styles} title="Payout Methods" meta={`${payouts?.payoutMethods?.length || 0}`} />
      {(payouts?.payoutMethods || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={CreditCard} label="No payout methods yet." />
      ) : (
        (payouts?.payoutMethods || []).map((method) => (
          <div
            key={method._id}
            className="flex flex-col gap-2 rounded-2xl border p-3.5"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div className="flex flex-row items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: theme.text }}>
                  {method.displayName || method.label || method.type}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {payoutMethodName(method)}
                </span>
              </div>
              <StatusPill styles={styles} status={method.status} />
            </div>
            <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
              Submitted: {formatDate(method.createdAt)}
            </span>
            {method.rejectionReason ? (
              <span className="block text-xs font-bold" style={{ color: theme.error }}>
                Rejected: {method.rejectionReason}
              </span>
            ) : null}
            {method.status === "VERIFIED" && !method.isDefault && method.source !== "PROFILE" && (
              <button
                type="button"
                onClick={() => onSetDefault(method._id)}
                className="cursor-pointer self-start rounded-xl border px-3 py-2"
                style={{ backgroundColor: theme.background, borderColor: theme.border }}
              >
                <span className="font-extrabold" style={{ color: theme.text }}>
                  Set Default
                </span>
              </button>
            )}
            {method.source === "PROFILE" && (
              <span className="block text-xs font-extrabold" style={{ color: theme.primary }}>
                Verified from rider profile
              </span>
            )}
            {method.isDefault && (
              <span className="block text-xs font-extrabold" style={{ color: theme.primary }}>
                Default method
              </span>
            )}
          </div>
        ))
      )}

      <SectionTitle styles={styles} title="Add Payout Method" meta="" />
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
        style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
      >
        <div className="flex flex-row gap-2.5">
          <button
            type="button"
            onClick={() => onPayoutTypeChange("UPI")}
            className={cn("flex min-h-[46px] flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] border px-3.5 py-3")}
            style={
              payoutType === "UPI"
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.background, borderColor: theme.border }
            }
          >
            <span className="font-extrabold" style={{ color: payoutType === "UPI" ? "#fff" : theme.text }}>
              UPI
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPayoutTypeChange("BANK")}
            className={cn("flex min-h-[46px] flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] border px-3.5 py-3")}
            style={
              payoutType === "BANK"
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.background, borderColor: theme.border }
            }
          >
            <span className="font-extrabold" style={{ color: payoutType === "BANK" ? "#fff" : theme.text }}>
              Bank
            </span>
          </button>
        </div>
        <TextInput {...inputChrome} value={methodLabel} onChangeText={onMethodLabelChange} placeholder="Label" placeholderTextColor={theme.secondaryText} />
        {payoutType === "UPI" ? (
          <TextInput {...inputChrome} value={upiId} onChangeText={onUpiIdChange} placeholder="UPI ID" placeholderTextColor={theme.secondaryText} autoCapitalize="none" />
        ) : (
          <>
            <TextInput {...inputChrome} value={accountHolderName} onChangeText={onAccountHolderNameChange} placeholder="Account holder" placeholderTextColor={theme.secondaryText} />
            <TextInput {...inputChrome} value={accountNumber} onChangeText={onAccountNumberChange} placeholder="Account number" placeholderTextColor={theme.secondaryText} keyboardType="number-pad" />
            <TextInput {...inputChrome} value={ifsc} onChangeText={onIfscChange} placeholder="IFSC" placeholderTextColor={theme.secondaryText} autoCapitalize="characters" />
            <TextInput {...inputChrome} value={bankName} onChangeText={onBankNameChange} placeholder="Bank name" placeholderTextColor={theme.secondaryText} />
          </>
        )}
        <button
          type="button"
          onClick={onSubmitPayoutMethod}
          disabled={busy}
          className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: theme.primary }}
        >
          <CreditCard size={16} color="#fff" />
          <span className="font-black text-white">Add Method</span>
        </button>
      </div>

      <SectionTitle styles={styles} title="Request Payout" meta={`${verifiedMethods.length} verified methods`} />
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
        style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
      >
        {payoutRequestMethods.length === 0 ? (
          <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
            A verified payout method is required before requesting payout.
          </span>
        ) : (
          <div className="flex flex-row gap-2 overflow-x-auto pr-[18px]">
            {payoutRequestMethods.map((method) => {
              const selected = requestMethodId === method._id;
              const verified = method.status === "VERIFIED";
              return (
                <button
                  key={method._id}
                  type="button"
                  onClick={() => verified && onRequestMethodIdChange(method._id)}
                  disabled={!verified}
                  className="min-h-[36px] shrink-0 cursor-pointer rounded-full border px-3 py-2 text-left disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: selected ? theme.primary : theme.secondaryBackground,
                    borderColor: selected ? theme.primary : theme.border,
                    opacity: !verified ? 0.62 : 1,
                  }}
                >
                  <span className="block text-xs font-extrabold" style={{ color: selected ? "#fff" : theme.secondaryText }}>
                    {method.displayName || payoutMethodName(method)}
                  </span>
                  {!verified && (
                    <span className="mt-0.5 block text-[9px] font-black" style={{ color: theme.tertiaryText }}>
                      {method.status.replace(/_/g, " ")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <TextInput {...inputChrome} value={requestAmount} onChangeText={onRequestAmountChange} placeholder="Amount" placeholderTextColor={theme.secondaryText} keyboardType="numeric" />
        <TextInput {...inputChrome} value={requestNote} onChangeText={onRequestNoteChange} placeholder="Note" placeholderTextColor={theme.secondaryText} />
        <button
          type="button"
          onClick={onRequestPayout}
          disabled={busy || !verifiedMethods.length}
          className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: theme.primary }}
        >
          <Banknote size={16} color="#fff" />
          <span className="font-black text-white">Request Payout</span>
        </button>
      </div>

      <SectionTitle styles={styles} title="Payout Requests" meta={`${payouts?.payouts?.length || 0}`} />
      {(payouts?.payouts || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={Wallet} label="No payout requests yet." />
      ) : (
        (payouts?.payouts || []).map((payout) => (
          <div
            key={payout._id}
            className="flex flex-col gap-2 rounded-2xl border p-3.5"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div className="flex flex-row items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: theme.text }}>
                  {money(payout.amount)}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {payout.method || "Payout method"} - {formatDate(payout.createdAt)}
                </span>
              </div>
              <StatusPill styles={styles} status={payout.status} />
            </div>
            {payout.referenceId ? (
              <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                Reference: {payout.referenceId}
              </span>
            ) : null}
            {payout.note ? (
              <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                {payout.note}
              </span>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
