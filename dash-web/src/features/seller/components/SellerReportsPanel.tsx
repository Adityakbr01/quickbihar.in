"use client";

import React, { useState } from "react";
import { ClipboardList, Package, ReceiptText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import { useSellerReports } from "../hooks/useSellerManagement";
import {
  Metric,
  SimpleTable,
  inputClass,
  formatAmount,
} from "./SellerHelpers";

export function SellerReportsPanel() {
  const [params, setParams] = useState<SellerQueryParams>({});
  const reportsQuery = useSellerReports(params);
  const reports = reportsQuery.data;

  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex flex-col gap-3 text-base text-white md:flex-row md:items-center md:justify-between">
            <span>Reports</span>
            <div className="flex flex-wrap gap-2">
              <DatePicker
                className={inputClass}
                value={params.dateFrom || ""}
                onChange={(value) => setParams((prev) => ({ ...prev, dateFrom: value || undefined }))}
                placeholder="Date From"
              />
              <DatePicker
                className={inputClass}
                value={params.dateTo || ""}
                onChange={(value) => setParams((prev) => ({ ...prev, dateTo: value || undefined }))}
                placeholder="Date To"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric
              title="Orders"
              value={reports?.summary.orders || 0}
              icon={<ClipboardList className="h-4 w-4" />}
            />
            <Metric
              title="Units Sold"
              value={reports?.summary.unitsSold || 0}
              icon={<Package className="h-4 w-4" />}
            />
            <Metric
              title="Gross Revenue"
              value={`Rs. ${formatAmount(reports?.summary.grossRevenue || 0)}`}
              icon={<ReceiptText className="h-4 w-4" />}
            />
            <Metric
              title="Customers"
              value={reports?.summary.customers || 0}
              icon={<Users className="h-4 w-4" />}
            />
          </section>
          <SimpleTable
            empty={reportsQuery.isLoading ? "Loading reports..." : "No product performance."}
            columns={["Product", "SKU", "Quantity", "Revenue"]}
            rows={(reports?.productPerformance || []).map((item) => [
              item.title,
              item.sku,
              item.quantity,
              `Rs. ${formatAmount(item.revenue)}`,
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
