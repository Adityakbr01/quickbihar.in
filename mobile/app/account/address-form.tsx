import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import AddressFormScreen from "@/src/features/Clothings/address/screen/AddressFormScreen";

const AddressFormRoute = () => {
  return (
    <SafeViewWrapper>
      <AddressFormScreen />
    </SafeViewWrapper>
  );
};

export default AddressFormRoute;
