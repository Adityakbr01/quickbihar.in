"use client";

import { useState } from "react";
import { BarChart3, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminListParams,
} from "../../api/adminManagement.api";
import {
  useAdminReports,
} from "../../hooks/useAdminManagement";
import {
  SectionHeader,
  LoadingState,
  EmptyState,
} from "../shared/AdminFullHelpers";
import { inputClass, formatAmount, downloadCsv } from "../../utils";

export function ReportsAnalyticsPanel() {
  const [params, setParams] = useState<AdminListParams>({});
  const reportsQuery = useAdminReports(params);
  const summary = reportsQuery.data?.summary;

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<BarChart3 className="h-4 w-4" />}
        title="Reports & Analytics"
        actionLabel="Export Reports"
        onAction={() => reportsQuery.data && exportReports(reportsQuery.data)}
        onRefresh={() => reportsQuery.refetch()}
      />
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <DatePicker
            className={inputClass}
            value={params.dateFrom || ""}
            onChange={(value) =>
              setParams((current) => ({ ...current, dateFrom: value || undefined }))
            }
            placeholder="Date From"
          />
          <DatePicker
            className={inputClass}
            value={params.dateTo || ""}
            onChange={(value) =>
              setParams((current) => ({ ...current, dateTo: value || undefined }))
            }
            placeholder="Date To"
          />
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setParams({})}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </CardContent>
      </Card>
      {reportsQuery.isLoading && <LoadingState label="Loading reports..." />}
      {summary && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={`Rs. ${formatAmount(summary.revenue)}`}
            />
            <MetricCard label="Orders" value={summary.orderCount} />
            <MetricCard label="Customers" value={summary.totalCustomers} />
            <MetricCard
              label="Low Stock"
              value={summary.lowStockProducts}
              tone={summary.lowStockProducts ? "warning" : "normal"}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ReportTable
              title="Orders By Status"
              rows={reportsQuery.data?.ordersByStatus || []}
              columns={["Status", "Orders", "Revenue"]}
              render={(row) => [
                row._id,
                row.count,
                `Rs. ${formatAmount(row.revenue)}`,
              ]}
            />
            <ReportTable
              title="Product Performance"
              rows={reportsQuery.data?.productPerformance || []}
              columns={["Product", "Qty", "Revenue"]}
              render={(row) => [
                row.title || row.sku,
                row.quantity,
                `Rs. ${formatAmount(row.revenue)}`,
              ]}
            />
            <ReportTable
              title="Daily Revenue"
              rows={reportsQuery.data?.dailyRevenue || []}
              columns={["Date", "Orders", "Revenue"]}
              render={(row) => [
                row._id,
                row.orders,
                `Rs. ${formatAmount(row.revenue)}`,
              ]}
            />
            <ReportTable
              title="Customer Analytics"
              rows={reportsQuery.data?.customerSummary || []}
              columns={["Customer", "Orders", "Revenue"]}
              render={(row) => [
                row.fullName || row.email || row._id,
                row.orders,
                `Rs. ${formatAmount(row.revenue)}`,
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ReportTable<T>({
  title,
  rows,
  columns,
  render,
}: {
  title: string;
  rows: T[];
  columns: string[];
  render: (row: T) => Array<string | number>;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!rows.length && <EmptyState label="No report rows found." />}
        {Boolean(rows.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {columns.map((column, index) => (
                  <TableHead
                    key={column}
                    className={index === 0 ? "px-4 text-gray-400" : "text-gray-400"}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  {render(row).map((value, index) => (
                    <TableCell
                      key={`${rowIndex}-${index}`}
                      className={
                        index === 0
                          ? "px-4 text-sm font-medium text-white"
                          : "text-sm text-gray-300"
                      }
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  tone?: "normal" | "warning";
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-normal text-gray-500">
          {label}
        </div>
        <div
          className={
            tone === "warning"
              ? "mt-2 text-2xl font-semibold text-amber-200"
              : "mt-2 text-2xl font-semibold text-white"
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function exportReports(
  report: NonNullable<ReturnType<typeof useAdminReports>["data"]>
) {
  downloadCsv("admin-reports.csv", [
    ["Metric", "Value"],
    ["Revenue", String(report.summary.revenue)],
    ["Orders", String(report.summary.orderCount)],
    ["Customers", String(report.summary.totalCustomers)],
    ["Low Stock", String(report.summary.lowStockProducts)],
  ]);
}
