"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectClass, inputClass } from "./types";
import { PaginationFooter } from "./PaginationFooter";
import {
  submissionTitle,
  submissionStatus,
  submissionSeller,
  submissionStore,
  optionalValue,
} from "./utils";
import { SubmissionStatusBadge } from "./badges";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/dashboard/utils";
import {
  useSellerSubmissions,
  useReviewSellerSubmission,
} from "@/features/dashboard/hooks/useAdminManagement";
import type { SellerSubmission, SellerSubmissionType } from "@/features/dashboard/api/adminManagement.api";

const sellerSubmissionTypeOptions: Array<{
  value: SellerSubmissionType;
  label: string;
}> = [
  { value: "products", label: "Products" },
  { value: "coupons", label: "Coupons" },
  { value: "banners", label: "Banners" },
  { value: "sizeCharts", label: "Size Charts" },
  { value: "categoryRequests", label: "Category Requests" },
];

export function SellerSubmissionsSection() {
  const [type, setType] = useState<SellerSubmissionType>("products");
  const [status, setStatus] = useState<
    "PENDING_REVIEW" | "PENDING" | "APPROVED" | "REJECTED" | "ALL"
  >("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const submissionsQuery = useSellerSubmissions({
    type,
    status,
    page,
    limit: 10,
  });
  const reviewSubmission = useReviewSellerSubmission();
  const submissions = submissionsQuery.data?.data || [];

  const [bannerReviewItem, setBannerReviewItem] =
    useState<SellerSubmission | null>(null);
  const [placement, setPlacement] = useState<string>("home_top");
  const [priority, setPriority] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const approve = (submission: SellerSubmission) => {
    if (type === "banners") {
      setBannerReviewItem(submission);
      setPlacement("home_top");
      setPriority(1);
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
    } else {
      reviewSubmission.mutate({ type, id: submission._id, status: "APPROVED" });
    }
  };

  const handleBannerApproveSubmit = () => {
    if (!bannerReviewItem) return;
    reviewSubmission.mutate(
      {
        type,
        id: bannerReviewItem._id,
        status: "APPROVED",
        placement: placement as any,
        priority,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setBannerReviewItem(null);
        },
      },
    );
  };

  const reject = (submission: SellerSubmission) => {
    reviewSubmission.mutate({
      type,
      id: submission._id,
      status: "REJECTED",
      reason: optionalValue(reasonById[submission._id] || ""),
    });
  };

  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Seller Review Queue
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as SellerSubmissionType);
                setPage(1);
              }}
              className={selectClass}
            >
              {sellerSubmissionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All</option>
            </select>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => submissionsQuery.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {submissionsQuery.isLoading && (
            <div className="px-4 py-10 text-sm text-gray-400">
              Loading seller submissions...
            </div>
          )}
          {!submissionsQuery.isLoading && !submissions.length && (
            <div className="px-4 py-10 text-sm text-gray-400">
              No submissions found.
            </div>
          )}
          {!submissionsQuery.isLoading && Boolean(submissions.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">
                    Submission
                  </TableHead>
                  <TableHead className="text-gray-400">Seller</TableHead>
                  <TableHead className="text-gray-400">Store</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Reason</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow
                    key={submission._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {submissionTitle(submission)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(submission.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {submissionSeller(submission).name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submissionSeller(submission).email}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {submissionStore(submission)}
                    </TableCell>
                    <TableCell>
                      <SubmissionStatusBadge
                        status={submissionStatus(submission)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={reasonById[submission._id] || ""}
                        onChange={(event) =>
                          setReasonById((current) => ({
                            ...current,
                            [submission._id]: event.target.value,
                          }))
                        }
                        placeholder="Reason"
                        className={cn(inputClass, "h-8 min-w-40")}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                          onClick={() => approve(submission)}
                          disabled={reviewSubmission.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => reject(submission)}
                          disabled={reviewSubmission.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PaginationFooter
        page={page}
        totalPages={submissionsQuery.data?.totalPages || 1}
        onPage={setPage}
      />

      {bannerReviewItem && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setBannerReviewItem(null)}
        >
          <DialogContent className="border-white/10 bg-[#1c1c1c] text-white">
            <DialogHeader>
              <DialogTitle>Approve Banner Submission</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">
                  Placement
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className={selectClass}
                >
                  <option value="home_top">Home Top</option>
                  <option value="home_middle">Home Middle</option>
                  <option value="category">Category</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">
                  Priority
                </label>
                <Input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBannerReviewItem(null)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBannerApproveSubmit}
                disabled={reviewSubmission.isPending}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Approve & Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
