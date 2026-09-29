import React from "react";
import * as Haptics from "@/lib/haptics";
import { AddressType } from "../schema/address.schema";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

interface AddressTypeSelectorProps {
  selectedType: AddressType;
  onSelect: (type: AddressType) => void;
  theme: Theme;
  styles?: any;
}

const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = ({
  selectedType,
  onSelect,
  theme,
}) => {
  const t = theme as any;
  return (
    <div className="mb-6 flex flex-row gap-3">
      {Object.values(AddressType).map((type) => {
        const selected = selectedType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => {
              onSelect(type);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={cn(
              "flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-xl border"
            )}
            style={{
              borderColor: selected ? t.primary : t.border,
              backgroundColor: selected
                ? "rgba(0, 122, 255, 0.05)"
                : t.tertiaryBackground,
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: selected ? t.primary : t.secondaryText }}
            >
              {type}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default AddressTypeSelector;
