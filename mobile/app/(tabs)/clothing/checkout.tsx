import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import CheckoutScreen from "@/src/features/common/order/screen/CheckoutScreen";

const ClothingCheckoutRoute = () => {
  return (
    <SafeViewWrapper>
      <CheckoutScreen />
    </SafeViewWrapper>
  );
};

export default ClothingCheckoutRoute;
