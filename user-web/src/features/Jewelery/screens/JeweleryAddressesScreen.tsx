import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Briefcase, Check, CircleCheck, House, MapPin, Pen, Phone, Plus, ShieldCheck, Trash2 } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goBack, goTo, replaceTo, useRouteParams } from "@/src/utils/navigation";
import React, { useState } from "react";

import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useAddressActions, useAddresses } from "@/src/features/common/address/hooks/useAddress";
import { AddressType, IAddress } from "@/src/features/common/address/schema/address.schema";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";

export default function JeweleryAddressesScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const bottomPad = 34;
  const { returnTo } = useRouteParams<{ returnTo?: string }>();

  const { data: addresses, isLoading, refetch } = useAddresses();
  const { deleteAddress, setDefaultAddress } = useAddressActions();

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    buttons: [],
  });

  const handleAddAddress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goTo(navigate, {
      pathname: "/jewelery/address-form" as any,
      params: returnTo ? { returnTo } : {},
    });
  };

  const handleEditAddress = (address: IAddress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goTo(navigate, {
      pathname: "/jewelery/address-form" as any,
      params: {
        id: address._id,
        data: JSON.stringify(address),
        ...(returnTo ? { returnTo } : {}),
      },
    });
  };

  const handleDeleteAddress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlertConfig({
      visible: true,
      title: "Remove Address",
      message: "Are you sure you want to remove this delivery address?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to remove address. Please try again.",
                buttons: [{ text: "OK" }],
              });
            }
          },
        },
      ],
    });
  };

  const handleSetDefault = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setDefaultAddress.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to set default address.",
        buttons: [{ text: "OK" }],
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (returnTo) {
      replaceTo(navigate, returnTo as any);
    } else {
      goBack(navigate, "/jewelery/(tabs)/profile");
    }
  };

  const getTypeIcon = (type: AddressType): LucideIcon => {
    switch (type) {
      case AddressType.HOME:
        return House;
      case AddressType.WORK:
        return Briefcase;
      default:
        return MapPin;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col" style={{ backgroundColor: colors.ivory }}>
      {/* Header */}
      <div
        className="flex flex-row items-center gap-3 px-5 pb-[14px]"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </button>

        <div className="flex-1">
          <h1
            className="text-[18px] tracking-[1.5px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            }}
          >
            SAVED ADDRESSES
          </h1>
          <p
            className="mt-[2px] text-[11px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            {addresses && addresses.length > 0
              ? `${addresses.length} address${addresses.length === 1 ? "" : "es"} on file`
              : "Manage delivery addresses"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAddress}
          className="flex cursor-pointer flex-row items-center gap-1 rounded-[2px] border px-[10px] py-[5px]"
          style={{ borderColor: colors.gold }}
        >
          <Plus size={14} color={colors.gold} />
          <span
            className="text-[11px] tracking-[0.5px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            Add
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="overflow-auto p-4" style={{ paddingBottom: bottomPad + 70 }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-[60px]">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: `${colors.gold}30`, borderTopColor: colors.gold }}
            />
            <span
              className="text-[13px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Loading addresses...
            </span>
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="flex flex-col gap-[14px]">
            {addresses.map((address) => {
              const TypeIcon = getTypeIcon(address.addressType);
              const isPinned =
                address.latitude !== undefined &&
                address.latitude !== 0 &&
                Number.isFinite(Number(address.latitude));

              return (
                <div key={address._id}
                  className="rounded-[3px] border p-4 shadow-sm"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: address.isDefault ? colors.gold : colors.border,
                    borderWidth: address.isDefault ? 1.5 : 1,
                  }}
                >
                  {/* Card Header Badges */}
                  <div className="mb-[10px] flex flex-row items-center justify-between">
                    <div className="flex flex-row flex-wrap items-center gap-1.5">
                      <div
                        className="flex flex-row items-center gap-1 rounded-[2px] border px-[7px] py-[2.5px]"
                        style={{
                          backgroundColor: colors.champagne,
                          borderColor: colors.gold,
                          borderWidth: 1,
                        }}
                      >
                        <TypeIcon size={10} color={colors.gold} />
                        <span
                          className="text-[9.5px] tracking-[0.6px]"
                          style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                        >
                          {address.addressType}
                        </span>
                      </div>

                      {address.isDefault && (
                        <div
                          className="flex flex-row items-center gap-1 rounded-[2px] px-[7px] py-[2.5px]"
                          style={{ backgroundColor: colors.gold }}
                        >
                          <Check size={10} color={colors.onBrand} />
                          <span
                            className="text-[9.5px] tracking-[0.6px]"
                            style={{ color: colors.onBrand, fontFamily: "DMSans_700Bold" }}
                          >
                            DEFAULT
                          </span>
                        </div>
                      )}

                      {isPinned && (
                        <div
                          className="flex flex-row items-center gap-1 rounded-[2px] border px-[7px] py-[2.5px]"
                          style={{
                            backgroundColor: colors.pearl,
                            borderColor: colors.border,
                            borderWidth: 1,
                          }}
                        >
                          <MapPin size={10} color={colors.gold} />
                          <span
                            className="text-[9.5px] tracking-[0.6px]"
                            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                          >
                            PINNED
                          </span>
                        </div>
                      )}

                      {address.isPhoneVerified && (
                        <div
                          className="flex flex-row items-center gap-1 rounded-[2px] border px-[7px] py-[2.5px]"
                          style={{
                            backgroundColor: colors.champagne,
                            borderColor: colors.gold,
                            borderWidth: 1,
                          }}
                        >
                          <ShieldCheck size={10} color={colors.gold} />
                          <span
                            className="text-[9.5px] tracking-[0.6px]"
                            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                          >
                            VERIFIED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Details */}
                  <h2
                    className="mb-1 text-[17px] tracking-[0.5px]"
                    style={{
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_600SemiBold",
                    }}
                  >
                    {address.fullName}
                  </h2>

                  <div className="mb-2 flex flex-row items-center gap-1.5">
                    <Phone size={11} color={colors.warmGray} />
                    <span
                      className="text-[12px]"
                      style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                    >
                      {address.phone}
                    </span>
                  </div>

                  <p
                    className="mb-3 text-[13px] leading-[19px]"
                    style={{ color: colors.ink, fontFamily: "DMSans_400Regular" }}
                  >
                    {address.street}
                    {address.landmark ? `, Near ${address.landmark}` : ""}
                    <br />
                    {address.city}, {address.state} — {address.pincode}
                  </p>

                  {/* Actions Divider */}
                  <div
                    className="mb-[10px] h-px"
                    style={{ backgroundColor: colors.border }}
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-row items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleEditAddress(address)}
                      className="flex cursor-pointer flex-row items-center gap-[5px] py-1"
                    >
                      <Pen size={13} color={colors.ink} />
                      <span
                        className="text-[12px]"
                        style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                      >
                        Edit
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address._id)}
                      className="flex cursor-pointer flex-row items-center gap-[5px] py-1"
                    >
                      <Trash2 size={13} color="#b91c1c" />
                      <span
                        className="text-[12px]"
                        style={{ color: "#b91c1c", fontFamily: "DMSans_500Medium" }}
                      >
                        Delete
                      </span>
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address._id)}
                        className="ml-auto flex cursor-pointer flex-row items-center gap-[5px] py-1"
                      >
                        <CircleCheck size={13} color={colors.gold} />
                        <span
                          className="text-[12px]"
                          style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                        >
                          Set Default
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-[70px]">
            <div
              className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.champagne,
                borderColor: colors.gold,
              }}
            >
              <MapPin size={32} color={colors.gold} />
            </div>
            <h2
              className="mb-2 text-[22px] tracking-[0.5px]"
              style={{
                color: colors.ink,
                fontFamily: "CormorantGaramond_600SemiBold",
              }}
            >
              No Addresses Saved
            </h2>
            <p
              className="mb-7 text-center text-[13px] leading-5"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Save your delivery addresses for an effortless, seamless shopping experience.
            </p>
            <button
              type="button"
              onClick={handleAddAddress}
              className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] px-6 py-[14px] shadow-md"
              style={{ backgroundColor: colors.gold }}
            >
              <Plus size={15} color={colors.onBrand} />
              <span
                className="text-[12px] tracking-[1.2px]"
                style={{ color: colors.onBrand, fontFamily: "DMSans_600SemiBold" }}
              >
                ADD DELIVERY ADDRESS
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button when addresses exist */}
      {addresses && addresses.length > 0 && (
        <button
          type="button"
          onClick={handleAddAddress}
          aria-label="Add address"
          className="absolute right-5 flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: colors.gold,
            bottom: bottomPad + 16,
          }}
        >
          <Plus size={22} color={colors.onBrand} />
        </button>
      )}

      {/* Alert Dialog */}
      <IOSAlertDialog visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
      />
    </div>
  );
}
