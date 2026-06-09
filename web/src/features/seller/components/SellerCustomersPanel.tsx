"use client";

import React, { useState } from "react";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import { useSellerCustomers } from "../hooks/useSellerManagement";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  PaginationBar,
  formatAmount,
  formatDate,
} from "./SellerHelpers";

export function SellerCustomersPanel() {
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const customersQuery = useSellerCustomers(params);

  return (
    <ModuleCard title="Customers" filters={<ListFilters params={params} onChange={setParams} />}>
      <SimpleTable
        empty={customersQuery.isLoading ? "Loading customers..." : "No customers found."}
        columns={["Customer", "Contact", "Orders", "Revenue", "Last Order"]}
        rows={(customersQuery.data?.data || []).map((customer) => [
          customer.fullName || "Customer",
          [customer.email, customer.phone].filter(Boolean).join(" / ") || "-",
          customer.orderCount,
          `Rs. ${formatAmount(customer.revenue)}`,
          formatDate(customer.lastOrderAt),
        ])}
      />
      <PaginationBar result={customersQuery.data} params={params} onChange={setParams} />
    </ModuleCard>
  );
}
