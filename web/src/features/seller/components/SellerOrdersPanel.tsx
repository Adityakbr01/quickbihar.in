"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import {
  useSellerOrders,
  useSellerOrderStatusMutation,
} from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  RowActions,
  PaginationBar,
  selectClass,
  formatAmount,
  formatDate,
} from "./SellerHelpers";

export function SellerOrdersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const ordersQuery = useSellerOrders(params);
  const updateStatus = useSellerOrderStatusMutation();
  const [statusByOrder, setStatusByOrder] = useState<Record<string, "CONFIRMED" | "PROCESSING" | "SHIPPED">>({});

  return (
    <ModuleCard
      title="Orders"
      filters={
        <ListFilters
          params={params}
          onChange={setParams}
          statusOptions={[
            "ALL",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ]}
        />
      }
    >
      <SimpleTable
        empty={ordersQuery.isLoading ? "Loading orders..." : "No orders found."}
        columns={["Order", "Customer", "Items", "Amount", "Status", "Fulfillment"]}
        rows={(ordersQuery.data?.data || []).map((order) => [
          <div key={`${order._id}-order`}>
            <div className="font-medium text-white">{order.orderId}</div>
            <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
          </div>,
          order.customer?.fullName || order.shippingAddress?.fullName || "Customer",
          order.items.map((item) => `${item.title} x${item.quantity}`).join(", "),
          `Rs. ${formatAmount(order.sellerSubtotal || 0)}`,
          <StatusBadge key={`${order._id}-status`} label={order.status} />,
          <RowActions key={`${order._id}-actions`}>
            <select
              value={statusByOrder[order._id] || "PROCESSING"}
              onChange={(event) =>
                setStatusByOrder((prev) => ({
                  ...prev,
                  [order._id]: event.target.value as "CONFIRMED" | "PROCESSING" | "SHIPPED",
                }))
              }
              className={selectClass}
            >
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
            </select>
            <Button
              size="sm"
              onClick={() =>
                updateStatus.mutate({
                  orderId: order._id,
                  status: statusByOrder[order._id] || "PROCESSING",
                })
              }
            >
              Update
            </Button>
          </RowActions>,
        ])}
      />
      <PaginationBar result={ordersQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}
