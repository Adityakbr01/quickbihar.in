import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import CartContent from "@/src/features/common/cart/screen/CartContent";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

const CartScreen = () => {
  return (
    <SafeViewWrapper>
      <NoIndexHead />
      <CartContent />
    </SafeViewWrapper>
  );
};

export default CartScreen;
