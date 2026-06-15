import AccountMain from "@/src/features/Clothings/account/screens/AccountMain";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const AccountScreen = () => {
  return (
    <SafeViewWrapper>
      <AccountMain />
    </SafeViewWrapper>
  );
};

export default AccountScreen;

