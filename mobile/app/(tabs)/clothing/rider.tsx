import { RoleEnum, useAuthStore } from "@/src/features/common/auth/store/authStore";
import { Redirect } from "expo-router";
import RiderWorkflowScreen from "../../rider";
import React from "react";

export default function RiderTabScreen() {
  const { user } = useAuthStore();
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isRider = roleName === RoleEnum.DELIVERY || roleName === "RIDER";

  if (!isRider) {
    return <Redirect href="/(tabs)/clothing/home" />;
  }

  return <RiderWorkflowScreen />;
}
