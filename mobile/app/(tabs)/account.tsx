import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import AccountMain from "@/src/features/account/screens/AccountMain";

const AccountScreen = () => {
  return (
    <SafeViewWrapper>
      <AccountMain />
    </SafeViewWrapper>
  );
};

export default AccountScreen;

