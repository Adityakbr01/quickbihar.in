import React from "react";
import SavedAddressesScreen from "@/src/features/address/screen/SavedAddressesScreen";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const AddressesRoute = () => {
  return (
    <SafeViewWrapper>
      <SavedAddressesScreen />
    </SafeViewWrapper>
  );
};

export default AddressesRoute;
