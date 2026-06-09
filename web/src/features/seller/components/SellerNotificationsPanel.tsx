"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import {
  useSellerNotifications,
  useSellerNotificationMutation,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  PaginationBar,
  formatDate,
} from "./SellerHelpers";

export function SellerNotificationsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const notificationsQuery = useSellerNotifications(params);
  const markRead = useSellerNotificationMutation();

  return (
    <ModuleCard
      title="Notifications"
      filters={
        <ListFilters
          params={params}
          onChange={setParams}
          statusOptions={["ALL", "unread", "read"]}
        />
      }
    >
      <SimpleTable
        empty={notificationsQuery.isLoading ? "Loading notifications..." : "No notifications."}
        columns={["Notification", "Type", "Severity", "Date", "Action"]}
        rows={(notificationsQuery.data?.data || []).map((notification) => [
          <div key={`${notification._id}-note`} className="min-w-64">
            <div className="font-medium text-white">{notification.title}</div>
            <div className="text-xs text-gray-500">{notification.message}</div>
          </div>,
          notification.type,
          <StatusBadge key={`${notification._id}-severity`} label={notification.severity} />,
          formatDate(notification.createdAt),
          notification.isRead ? (
            "Read"
          ) : (
            <Button
              key={`${notification._id}-action`}
              size="sm"
              onClick={() => markRead.mutate(notification._id)}
            >
              Mark Read
            </Button>
          ),
        ])}
      />
      <PaginationBar result={notificationsQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}
