import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { AnimatedPrice } from "@/src/components/common/AnimatedPrice";
import { cn } from "@/src/lib/utils";

export interface CartItemDisplayItem {
  id: string;
  name: string;
  price?: number;
  unitPrice?: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  sku: string;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartItemProps {
  item: CartItemDisplayItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const theme = useTheme() as any;

  const numericPrice = typeof item.unitPrice === "number"
    ? item.unitPrice
    : (typeof item.price === "number"
      ? item.price
      : 0);

  const itemTotal = numericPrice * item.quantity;
  const isMinQuantity = item.quantity <= 1;

  const handleDecrement = () => {
    if (!isMinQuantity) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdateQuantity(item.id, -1);
    }
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQuantity(item.id, 1);
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(item.id);
  };

  return (
    <div
      className="mx-4 my-1.5 flex flex-row overflow-hidden rounded-[18px] border p-3"
      style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
    >
      <img
        src={item.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80"}
        alt={`${item.name} - Shop Online in Bihar`}
        title={`${item.name} | QuickBihar`}
        className="h-[108px] w-[84px] shrink-0 rounded-xl object-cover"
        style={{ backgroundColor: theme.background }}
        loading="lazy"
        decoding="async"
      />

      <div className="ml-3 flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex min-w-0 flex-row items-start justify-between gap-2">
            <p
              className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-5 font-bold"
              style={{ color: theme.text }}
            >
              {item.name}
            </p>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${item.name}`}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.background }}
            >
              <Trash2 size={16} color={theme.secondaryText} />
            </button>
          </div>

          {(item.selectedSize || item.selectedColor) ? (
            <p
              className="line-clamp-1 mt-1.5 text-xs font-medium"
              style={{ color: theme.secondaryText }}
            >
              {[
                item.selectedSize ? `Size: ${item.selectedSize}` : null,
                item.selectedColor ? `Color: ${item.selectedColor}` : null,
              ].filter(Boolean).join("  •  ")}
            </p>
          ) : null}
        </div>

        <div className="mt-2.5 flex min-w-0 flex-row items-end justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <AnimatedPrice
              value={numericPrice}
              style={{ fontSize: 16, fontWeight: 800, color: theme.text }}
            />
            {item.quantity > 1 ? (
              <div className="mt-0.5 flex flex-row items-baseline">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: theme.secondaryText }}
                >
                  Item Total:{" "}
                </span>
                <AnimatedPrice
                  value={itemTotal}
                  style={{ fontSize: 11, fontWeight: 600, color: theme.secondaryText, marginTop: 2 }}
                />
              </div>
            ) : item.originalPrice && item.originalPrice > numericPrice ? (
              <AnimatedPrice
                value={item.originalPrice}
                style={{ fontSize: 12, color: theme.secondaryText, textDecorationLine: "line-through", marginTop: 2 }}
              />
            ) : null}
          </div>

          <div
            className="flex shrink-0 flex-row items-center rounded-full border px-[3px] py-[3px]"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <button
              type="button"
              onClick={handleDecrement}
              disabled={isMinQuantity}
              aria-label="Decrease quantity"
              className={cn(
                "flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed",
                isMinQuantity && "opacity-35",
              )}
              style={{ backgroundColor: theme.tertiaryBackground }}
            >
              <Minus size={16} color={isMinQuantity ? theme.secondaryText : theme.text} />
            </button>

            <span
              className="min-w-[26px] text-center text-sm font-extrabold"
              style={{ color: theme.text }}
            >
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.tertiaryBackground }}
            >
              <Plus size={16} color={theme.text} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
