import React from "react";
import { Wallet } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface CartHeaderProps {
  productsCount: number;
  totalUnits: number;
}

const CartHeader = ({ productsCount, totalUnits }: CartHeaderProps) => {
  const theme = useTheme() as any;

  const productLabel = productsCount === 1 ? "product" : "products";
  const itemLabel = totalUnits === 1 ? "item" : "items";

  return (
    <div className="flex flex-row items-center justify-between px-5 py-4">
      <div>
        <h2 className="text-2xl font-extrabold" style={{ color: theme.text }}>
          My Cart
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: theme.secondaryText }}>
          {productsCount} {productLabel} · {totalUnits} {itemLabel}
        </p>
      </div>
      {/* Static icon on web: lottie-react-native ignores fixed sizes there
          and renders the composition at full size, breaking the header. */}
      <div
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full"
        style={{ backgroundColor: theme.tertiaryBackground }}
      >
        <Wallet size={28} color={theme.primary} />
      </div>
    </div>
  );
};

export default CartHeader;
