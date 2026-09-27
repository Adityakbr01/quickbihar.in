import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import CheckoutScreen from "@/src/features/common/order/screen/CheckoutScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

const ClothingCheckoutRoute = () => {
  return (
    <SafeViewWrapper>
      <NoIndexHead />
      <CheckoutScreen />
    </SafeViewWrapper>
  );
};

export default ClothingCheckoutRoute;
