import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type {
  RiderEarningsResponse,
  RiderPayoutMethod,
  RiderPayoutsResponse,
  RiderWallet,
} from "../../api/delivery.api";
import { formatDate, money, payoutMethodName } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";
import { EmptyCard, SectionTitle, StatusPill, SummaryTile } from "./RiderShared";

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
  const verifiedMethods = payoutRequestMethods.filter((method) => method.status === "VERIFIED");

  return (
    <View style={styles.panel}>
      <SectionTitle styles={styles} title="Earnings" meta={`${earnings?.ledger?.length || 0} ledger entries`} />
      <View style={styles.inlineInputs}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={earningsDateFrom}
          onChangeText={onEarningsDateFromChange}
          placeholder="From YYYY-MM-DD"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={earningsDateTo}
          onChangeText={onEarningsDateToChange}
          placeholder="To YYYY-MM-DD"
          placeholderTextColor={theme.secondaryText}
        />
      </View>
      <View style={styles.summaryGrid}>
        <SummaryTile styles={styles} label="Available" value={money(wallet?.availableBalance)} />
        <SummaryTile styles={styles} label="Pending" value={money(wallet?.pendingPayoutBalance)} />
        <SummaryTile styles={styles} label="Credited" value={money(earnings?.totalCredited)} />
      </View>

      <SectionTitle styles={styles} title="Earnings Ledger" meta="" />
      {(earnings?.ledger || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="wallet-outline" label="No credited earnings in this date range." />
      ) : (
        (earnings?.ledger || []).map((entry) => (
          <View key={entry._id} style={styles.listCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{entry.orderId}</Text>
                <Text style={styles.muted}>
                  {entry.customerName || "Customer"} - {formatDate(entry.creditedAt || entry.deliveredAt)}
                </Text>
              </View>
              <Text style={styles.payout}>{money(entry.amount)}</Text>
            </View>
          </View>
        ))
      )}

      <SectionTitle styles={styles} title="Payout Methods" meta={`${payouts?.payoutMethods?.length || 0}`} />
      {(payouts?.payoutMethods || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="card-outline" label="No payout methods yet." />
      ) : (
        (payouts?.payoutMethods || []).map((method) => (
          <View key={method._id} style={styles.methodCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{method.displayName || method.label || method.type}</Text>
                <Text style={styles.muted}>{payoutMethodName(method)}</Text>
              </View>
              <StatusPill styles={styles} status={method.status} />
            </View>
            <Text style={styles.muted}>Submitted: {formatDate(method.createdAt)}</Text>
            {method.rejectionReason ? <Text style={styles.errorText}>Rejected: {method.rejectionReason}</Text> : null}
            {method.status === "VERIFIED" && !method.isDefault && method.source !== "PROFILE" && (
              <TouchableOpacity style={styles.smallSecondaryButton} onPress={() => onSetDefault(method._id)}>
                <Text style={styles.secondaryText}>Set Default</Text>
              </TouchableOpacity>
            )}
            {method.source === "PROFILE" && <Text style={styles.primaryLine}>Verified from rider profile</Text>}
            {method.isDefault && <Text style={styles.primaryLine}>Default method</Text>}
          </View>
        ))
      )}

      <SectionTitle styles={styles} title="Add Payout Method" meta="" />
      <View style={styles.formCard}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.secondaryButton, payoutType === "UPI" && styles.segmentSelected]} onPress={() => onPayoutTypeChange("UPI")}>
            <Text style={[styles.secondaryText, payoutType === "UPI" && styles.segmentSelectedText]}>UPI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, payoutType === "BANK" && styles.segmentSelected]} onPress={() => onPayoutTypeChange("BANK")}>
            <Text style={[styles.secondaryText, payoutType === "BANK" && styles.segmentSelectedText]}>Bank</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} value={methodLabel} onChangeText={onMethodLabelChange} placeholder="Label" placeholderTextColor={theme.secondaryText} />
        {payoutType === "UPI" ? (
          <TextInput style={styles.input} value={upiId} onChangeText={onUpiIdChange} placeholder="UPI ID" placeholderTextColor={theme.secondaryText} autoCapitalize="none" />
        ) : (
          <>
            <TextInput style={styles.input} value={accountHolderName} onChangeText={onAccountHolderNameChange} placeholder="Account holder" placeholderTextColor={theme.secondaryText} />
            <TextInput style={styles.input} value={accountNumber} onChangeText={onAccountNumberChange} placeholder="Account number" placeholderTextColor={theme.secondaryText} keyboardType="number-pad" />
            <TextInput style={styles.input} value={ifsc} onChangeText={onIfscChange} placeholder="IFSC" placeholderTextColor={theme.secondaryText} autoCapitalize="characters" />
            <TextInput style={styles.input} value={bankName} onChangeText={onBankNameChange} placeholder="Bank name" placeholderTextColor={theme.secondaryText} />
          </>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={onSubmitPayoutMethod} disabled={busy}>
          <Ionicons name="card-outline" size={16} color="#fff" />
          <Text style={styles.primaryText}>Add Method</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle styles={styles} title="Request Payout" meta={`${verifiedMethods.length} verified methods`} />
      <View style={styles.formCard}>
        {payoutRequestMethods.length === 0 ? (
          <Text style={styles.muted}>A verified payout method is required before requesting payout.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {payoutRequestMethods.map((method) => {
              const selected = requestMethodId === method._id;
              const verified = method.status === "VERIFIED";
              return (
                <TouchableOpacity
                  key={method._id}
                  style={[styles.filterChip, !verified && styles.filterChipDisabled, selected && styles.filterChipSelected]}
                  onPress={() => verified && onRequestMethodIdChange(method._id)}
                  disabled={!verified}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                    {method.displayName || payoutMethodName(method)}
                  </Text>
                  {!verified && <Text style={styles.filterChipMeta}>{method.status.replace(/_/g, " ")}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <TextInput style={styles.input} value={requestAmount} onChangeText={onRequestAmountChange} placeholder="Amount" placeholderTextColor={theme.secondaryText} keyboardType="numeric" />
        <TextInput style={styles.input} value={requestNote} onChangeText={onRequestNoteChange} placeholder="Note" placeholderTextColor={theme.secondaryText} />
        <TouchableOpacity style={styles.primaryButton} onPress={onRequestPayout} disabled={busy || !verifiedMethods.length}>
          <Ionicons name="cash-outline" size={16} color="#fff" />
          <Text style={styles.primaryText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle styles={styles} title="Payout Requests" meta={`${payouts?.payouts?.length || 0}`} />
      {(payouts?.payouts || []).length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="wallet-outline" label="No payout requests yet." />
      ) : (
        (payouts?.payouts || []).map((payout) => (
          <View key={payout._id} style={styles.listCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{money(payout.amount)}</Text>
                <Text style={styles.muted}>
                  {payout.method || "Payout method"} - {formatDate(payout.createdAt)}
                </Text>
              </View>
              <StatusPill styles={styles} status={payout.status} />
            </View>
            {payout.referenceId ? <Text style={styles.muted}>Reference: {payout.referenceId}</Text> : null}
            {payout.note ? <Text style={styles.muted}>{payout.note}</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}
