import React from "react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import LazyLottie from "@/src/components/common/LazyLottie";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

import { ShoppingBag } from "lucide-react";

const cartLottie = "/lottie/shoppingCart.json";

const EmptyCart = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, "/(tabs)/clothing/home" as any);
  };

  return (
    <div className="mx-auto mt-10 flex w-full max-w-[600px] flex-1 flex-col items-center justify-center p-8 pb-[100px]">
      <LazyLottie
        source={cartLottie}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
        resizeMode="contain"
      />
      <h2 className="mt-5 text-[22px] font-extrabold" style={{ color: theme.text }}>
        Your cart is empty
      </h2>
      <p
        className="mt-2.5 max-w-[300px] text-center text-sm leading-[22px]"
        style={{ color: theme.secondaryText }}
      >
        Looks like you haven&apos;t added anything to your cart yet. Discover trending styles and exclusive offers!
      </p>

      <button
        type="button"
        onClick={handleShopNow}
        className="mt-7 flex cursor-pointer flex-row items-center gap-2 rounded-[14px] px-7 py-3.5"
        style={{ backgroundColor: theme.primary }}
      >
        <ShoppingBag size={18} color="#fff" />
        <span className="text-[15px] font-extrabold text-white">Continue Shopping</span>
      </button>
    </div>
  );
};

export default EmptyCart;
