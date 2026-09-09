import React from "react";
import OrderSuccessScreen from "@/src/features/common/order/screen/OrderSuccessScreen";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

const OrderSuccessRoute = () => {
  return (
    <SafeViewWrapper>
      <NoIndexHead />
      <OrderSuccessScreen />
    </SafeViewWrapper>
  );
};

export default OrderSuccessRoute;
