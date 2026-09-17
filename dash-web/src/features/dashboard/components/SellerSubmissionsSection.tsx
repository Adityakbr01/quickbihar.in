"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
  FileText,
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
  useAdminOnboardingApplications,
  useReviewOnboardingApplication,
} from "@/features/onboarding/hooks/useOnboardingAdmin";
import {
  useSellerSubmissions,
  useReviewSellerSubmission,
} from "@/features/dashboard/hooks/useAdminManagement";
import type { SellerSubmission, SellerSubmissionType } from "@/features/dashboard/api/adminManagement.api";

const sellerSubmissionTypeOptions: Array<{
  value: string;
  label: string;
}> = [
  { value: "onboarding", label: "Partner Applications (Sellers & Riders)" },
  { value: "products", label: "Products" },
  { value: "coupons", label: "Coupons" },
  { value: "banners", label: "Banners" },
  { value: "sizeCharts", label: "Size Charts" },
  { value: "categoryRequests", label: "Category Requests" },
];

export function SellerSubmissionsSection() {
  const [type, setType] = useState<string>("onboarding");
  const [status, setStatus] = useState<
    "PENDING_REVIEW" | "PENDING" | "APPROVED" | "REJECTED" | "ALL"
  >("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const submissionsQuery = useSellerSubmissions({
    type: (type === "onboarding" ? "products" : type) as SellerSubmissionType,
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
      reviewSubmission.mutate({ type: type as SellerSubmissionType, id: submission._id, status: "APPROVED" });
    }
  };

  const handleBannerApproveSubmit = () => {
    if (!bannerReviewItem) return;
    reviewSubmission.mutate(
      {
        type: type as SellerSubmissionType,
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
      type: type as SellerSubmissionType,
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
            Seller & Partner Review Queue
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
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

        {type === "onboarding" ? (
          <OnboardingApplicationsTable
            status={status}
            reasonById={reasonById}
            setReasonById={setReasonById}
          />
        ) : (
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
        )}
      </Card>
      {type !== "onboarding" && (
        <PaginationFooter
          page={page}
          totalPages={submissionsQuery.data?.totalPages || 1}
          onPage={setPage}
        />
      )}

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

function OnboardingApplicationsTable({
  status,
  reasonById,
  setReasonById,
}: {
  status: string;
  reasonById: Record<string, string>;
  setReasonById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const queryStatus = status === "ALL" ? undefined : (status === "PENDING_REVIEW" ? "PENDING" : status);
  const applicationsQuery = useAdminOnboardingApplications(undefined, queryStatus);
  const reviewApplication = useReviewOnboardingApplication();
  const applications = applicationsQuery.data || [];

  return (
    <CardContent className="px-0">
      {applicationsQuery.isLoading && (
        <div className="px-4 py-10 text-sm text-gray-400">Loading onboarding applications...</div>
      )}
      {!applicationsQuery.isLoading && !applications.length && (
        <div className="px-4 py-10 text-sm text-gray-400">No partner onboarding applications found.</div>
      )}
      {!applicationsQuery.isLoading && Boolean(applications.length) && (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="px-4 text-gray-400">Applicant</TableHead>
              <TableHead className="text-gray-400">Type & Business</TableHead>
              <TableHead className="text-gray-400">Bank & Verification</TableHead>
              <TableHead className="text-gray-400">Documents</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Reason</TableHead>
              <TableHead className="text-right text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app: any) => {
              const user = app.userId || {};
              const details = app.details || {};
              const bank = details.bankDetails || {};
              const docs = app.documents || [];

              return (
                <TableRow key={app._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{user.fullName || user.username || "Applicant"}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-500">{user.phone || "No phone"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          app.type === "SELLER"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 font-semibold"
                            : "border-blue-400/30 bg-blue-400/10 text-blue-300 font-semibold"
                        }
                      >
                        {app.type}
                      </Badge>
                      <span className="text-sm font-medium text-white">
                        {details.businessName || details.vehicleType || "-"}
                      </span>
                    </div>
                    {details.sellerType && (
                      <div className="mt-1 text-xs text-gray-400">Category: {details.sellerType}</div>
                    )}
                    {details.gstNumber && (
                      <div className="text-xs text-gray-400">GST: {details.gstNumber}</div>
                    )}
                    {details.address?.address && (
                      <div className="text-xs text-gray-500">
                        {details.address.address}, {details.address.city} ({details.address.pincode})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {bank.bankName ? (
                      <div className="text-xs text-gray-300 leading-relaxed">
                        <div><span className="text-gray-500">Bank:</span> {bank.bankName}</div>
                        <div><span className="text-gray-500">A/C:</span> {bank.accountNumber}</div>
                        <div><span className="text-gray-500">IFSC:</span> {bank.ifsc}</div>
                        {bank.pan && <div><span className="text-gray-500">PAN:</span> {bank.pan}</div>}
                        {bank.aadhar && <div><span className="text-gray-500">Aadhaar:</span> {bank.aadhar}</div>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No bank details</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {docs.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {docs.map((doc: any, i: number) => (
                          <a
                            key={doc.fileId || doc._id || i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 underline hover:text-emerald-300 truncate max-w-40"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            {doc.name || `Document ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No docs</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        app.status === "APPROVED"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : app.status === "REJECTED"
                          ? "border-red-400/30 bg-red-400/10 text-red-300"
                          : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                      }
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={reasonById[app._id] || ""}
                      onChange={(e) =>
                        setReasonById((current) => ({
                          ...current,
                          [app._id]: e.target.value,
                        }))
                      }
                      placeholder="Reason (if rejecting)"
                      className={cn(inputClass, "h-8 min-w-36")}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {app.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                          disabled={reviewApplication.isPending}
                          onClick={() =>
                            reviewApplication.mutate({ id: app._id, status: "APPROVED" })
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                      {app.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reviewApplication.isPending}
                          onClick={() =>
                            reviewApplication.mutate({
                              id: app._id,
                              status: "REJECTED",
                              reason: optionalValue(reasonById[app._id] || ""),
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CardContent>
  );
}
