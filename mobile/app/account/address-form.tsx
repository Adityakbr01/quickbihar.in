import React from "react";
import AddressFormScreen from "@/src/features/address/screen/AddressFormScreen";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const AddressFormRoute = () => {
  return (
    <SafeViewWrapper>
      <AddressFormScreen />
    </SafeViewWrapper>
  );
};

export default AddressFormRoute;
