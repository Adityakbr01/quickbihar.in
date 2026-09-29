import React from "react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { CircleCheck, MapPin, SquarePen, Trash2 } from "lucide-react";
import { AddressType, IAddress } from "../schema/address.schema";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

interface AddressCardProps {
  address: IAddress;
  theme: Theme;
  styles?: any;
  onEdit: (address: IAddress) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  theme,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const getTypeIcon = () => {
    switch (address.addressType) {
      case AddressType.HOME:
        return "home-outline";
      case AddressType.WORK:
        return "briefcase-outline";
      default:
        return "location-outline";
    }
  };
  void getTypeIcon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(address)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit(address);
      }}
      className="mb-4 cursor-pointer rounded-[20px] border p-5 shadow-sm"
      style={{
        backgroundColor: theme.tertiaryBackground,
        borderColor: address.isDefault ? theme.primary : theme.border,
        borderWidth: address.isDefault ? 1.5 : 1,
      }}
    >
      <div className="mb-3 flex flex-row items-center justify-between gap-2">
        <div
          className="rounded-lg px-2.5 py-1"
          style={{ backgroundColor: theme.background }}
        >
          <span
            className="text-xs font-bold uppercase"
            style={{ color: theme.primary }}
          >
            {address.addressType}
          </span>
        </div>

        <div className="flex flex-row items-center gap-2">
          {address.isDefault && (
            <div className="rounded-md bg-[#E3FFEF] px-2 py-1">
              <span className="text-[10px] font-bold text-[#00C853]">DEFAULT</span>
            </div>
          )}

          {address.latitude !== undefined && address.latitude !== 0 && (
            <div
              className="flex flex-row items-center gap-1 rounded-md border px-2 py-1"
              style={{
                backgroundColor: "rgba(0, 122, 255, 0.1)",
                borderColor: "rgba(0, 122, 255, 0.2)",
              }}
            >
              <AppIcon icon={MapPin} size={12} color={theme.primary} />
              <span
                className="text-[10px] font-bold"
                style={{ color: theme.primary }}
              >
                PINNED
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mb-1 text-[18px] font-bold" style={{ color: theme.text }}>
        {address.fullName}
      </p>
      <p className="mb-3 text-sm" style={{ color: theme.secondaryText }}>
        {address.phone}
      </p>

      <p
        className="mb-4 line-clamp-3 text-[15px] leading-[22px]"
        style={{ color: theme.text }}
      >
        {address.street},{address.landmark ? ` ${address.landmark}, ` : " "}
        {address.city}, {address.state} - {address.pincode}
      </p>

      <div
        className="flex flex-row flex-wrap gap-3 border-t pt-4"
        style={{ borderTopColor: theme.border }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(address);
          }}
          className="flex cursor-pointer flex-row items-center rounded-[10px] border px-3 py-2"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
        >
          <AppIcon icon={SquarePen} size={18} color={theme.text} />
          <span
            className="ml-1.5 text-[13px] font-semibold"
            style={{ color: theme.text }}
          >
            Edit
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(address._id);
          }}
          className={cn("flex cursor-pointer flex-row items-center rounded-[10px] border px-3 py-2")}
          style={{
            backgroundColor: theme.background,
            borderColor: "rgba(255, 59, 48, 0.2)",
          }}
        >
          <AppIcon icon={Trash2} size={18} color="#FF3B30" />
          <span className="ml-1.5 text-[13px] font-semibold text-[#FF3B30]">
            Delete
          </span>
        </button>

        {!address.isDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(address._id);
            }}
            className="flex cursor-pointer flex-row items-center rounded-[10px] border px-3 py-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
            }}
          >
            <AppIcon icon={CircleCheck} size={18} color={theme.primary} />
            <span
              className="ml-1.5 text-[13px] font-semibold"
              style={{ color: theme.primary }}
            >
              Set Default
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
