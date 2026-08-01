import {
  getRoleName,
  RIDER_ROLE_ALIAS,
  RoleEnum,
  useAuthStore,
} from "@/src/features/common/auth/store/authStore";
import { Redirect } from "expo-router";
import RiderWorkspaceScreen from "@/src/features/Delivery/screens/RiderWorkspaceScreen";
import React from "react";

export default function RiderTabScreen() {
  const { user } = useAuthStore();
  const roleName = getRoleName(user?.role);
  const isRider = roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS;

  if (!isRider) {
    return <Redirect href="/(tabs)/clothing/home" />;
  }

  return <RiderWorkspaceScreen />;
}
