import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import CartContent from "@/src/features/cart/screen/CartContent";

const CartScreen = () => {
  return (
    <SafeViewWrapper>
      <CartContent />
    </SafeViewWrapper>
  );
};

export default CartScreen;
