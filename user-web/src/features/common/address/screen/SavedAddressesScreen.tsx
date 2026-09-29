import React from "react";
import { useNavigate } from "react-router-dom";
import { goBack, goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import { ChevronLeft, CirclePlus, MapPin, RefreshCw } from "lucide-react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useAddresses, useAddressActions } from "../hooks/useAddress";
import AddressCard from "../components/AddressCard";
import { AddressCardSkeleton } from "../components/AddressCardSkeleton";
import { IAddress } from "../schema/address.schema";
import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useState } from "react";

const SavedAddressesScreen = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();

  const { data: addresses, isLoading, refetch, isFetching } = useAddresses();
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
    goTo(navigate, "/account/address-form");
  };

  const handleEditAddress = (address: IAddress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goTo(navigate, {
      pathname: "/account/address-form",
      params: { id: address._id, data: JSON.stringify(address) }
    });
  };

  const handleDeleteAddress = (id: string) => {
    setAlertConfig({
      visible: true,
      title: "Delete Address",
      message: "Are you sure you want to delete this address? This action cannot be undone.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to delete address. Please try again.",
                buttons: [{ text: "OK" }]
              });
            }
          }
        }
      ]
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to set default address.",
        buttons: [{ text: "OK" }]
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    goBack(navigate, "/(tabs)/clothing/home");
  };

  const renderSkeletons = () => (
    <div>
      {[0, 1, 2].map((i) => (
        <AddressCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center pb-[30px]"
      style={{ backgroundColor: theme.background }}
    >
      {/* Top app bar (same language as Notifications) */}
      <div className="flex w-full max-w-[800px] flex-row items-center gap-2 px-3 pt-2 pb-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </button>

        <div className="flex-1 px-1">
          <p
            className="text-[22px] font-extrabold tracking-[-0.4px]"
            style={{ color: theme.text }}
          >
            Saved Addresses
          </p>
          <p
            className="mt-0.5 text-xs font-medium"
            style={{ color: theme.secondaryText }}
          >
            {addresses && addresses.length > 0
              ? `${addresses.length} address${addresses.length === 1 ? "" : "es"} saved`
              : "Manage your delivery addresses"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Refresh addresses"
          title="Refresh addresses"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <RefreshCw
            size={18}
            color={theme.text}
            className={isFetching ? "animate-spin" : undefined}
          />
        </button>
      </div>

      <div className="flex w-full max-w-[800px] flex-1 flex-col">
        <div className="overflow-auto px-4 pt-2 pb-10">
          {isLoading ? (
            renderSkeletons()
          ) : addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                theme={theme}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefault}
              />
            ))
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
              <div
                className="mb-[18px] flex h-[110px] w-[110px] items-center justify-center rounded-full"
                style={{ backgroundColor: theme.primary + "15" }}
              >
                <MapPin size={52} color={theme.primary} />
              </div>
              <p
                className="text-center text-xl font-extrabold tracking-[-0.3px]"
                style={{ color: theme.text }}
              >
                No Saved Addresses
              </p>
              <p
                className="mt-2 max-w-[320px] text-center text-sm leading-5"
                style={{ color: theme.secondaryText }}
              >
                Add your delivery address to enjoy a faster checkout experience.
              </p>
              <button
                type="button"
                onClick={handleAddAddress}
                className="mt-5 flex h-[50px] w-[220px] cursor-pointer items-center justify-center rounded-[18px] shadow-lg"
                style={{ backgroundColor: theme.primary }}
              >
                <span className="text-[17px] font-bold text-white">
                  Add New Address
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {addresses && addresses.length > 0 && (
        <button
          type="button"
          onClick={handleAddAddress}
          aria-label="Add new address"
          className="absolute right-[30px] bottom-[30px] flex h-16 w-16 cursor-pointer items-center justify-center rounded-full shadow-xl"
          style={{ backgroundColor: theme.primary }}
        >
          <AppIcon icon={CirclePlus} size={32} color="#fff" />
        </button>
      )}

      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default SavedAddressesScreen;
