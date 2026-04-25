import React from "react";
import OrderSuccessScreen from "@/src/features/Clothings/order/screen/OrderSuccessScreen";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const OrderSuccessRoute = () => {
  return (
    <SafeViewWrapper>
      <OrderSuccessScreen />
    </SafeViewWrapper>
  );
};

export default OrderSuccessRoute;
