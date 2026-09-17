import React, { type FormEvent, useState } from "react";
import { Plus, Edit, Trash2, Save, Store, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminSellers,
  useCreateSeller,
  useUpdateSeller,
  useDeleteSeller,
  useAdminPolicies,
} from "../../hooks/useAdminManagement";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
  SellerStatusBadge,
} from "../shared/TableHelpers";
import { selectClass, inputClass, formatDate } from "../../utils";
import type { AdminListParams, ManagedPerson } from "../../api/adminManagement.api";

export function SellerManagementPanel() {
  const confirm = useConfirm();
  const [params, setParams] = useState<AdminListParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const sellersQuery = useAdminSellers(params);
  const createSeller = useCreateSeller();
  const updateSeller = useUpdateSeller();
  const deleteSeller = useDeleteSeller();
  const policiesQuery = useAdminPolicies({ page: 1, limit: 100, status: "true" });

  const sellers = sellersQuery.data || [];
  const policies = policiesQuery.data?.data || [];

  const setParam = (key: keyof AdminListParams, value: any) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Seller Accounts"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All Statuses" },
          { value: "true", label: "Active Sellers" },
          { value: "false", label: "Deactivated" },
        ]}
        onStatus={(value) => setParam("status", value === "all" ? undefined : value === "true" ? "ACTIVE" : "INACTIVE")}
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created Date" },
          { value: "businessName", label: "Business Name" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => sellersQuery.refetch()}
        extraAction={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Seller Account
          </Button>
        }
      />

      <Card className="border-border bg-card">
        <CardContent className="px-0">
          {sellersQuery.isLoading && <LoadingState label="Loading sellers..." />}
          {!sellersQuery.isLoading && !sellers.length && <EmptyState label="No sellers found." />}
          {!sellersQuery.isLoading && Boolean(sellers.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-4 text-muted-foreground">Business / Owner</TableHead>
                  <TableHead className="text-muted-foreground">Mall Address</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Wallet</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller: ManagedPerson) => (
                  <TableRow key={seller._id} className="border-border hover:bg-muted">
                    <TableCell className="px-4">
                      <div className="font-medium text-foreground">{seller.sellerProfile?.businessName || seller.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {seller.fullName || "Owner"} · {seller.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {seller.sellerProfile?.mallId ? (
                        <div className="flex items-center gap-1">
                          <Store className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-300" />
                          <span>
                            {seller.sellerProfile.mallName || "Mall"} · Unit {seller.sellerProfile.mallUnit}
                          </span>
                        </div>
                      ) : (
                        "Independent"
                      )}
                    </TableCell>
                    <TableCell>
                      <SellerStatusBadge status={seller.sellerProfile?.status || "INACTIVE"} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Rs. {seller.sellerProfile?.wallet?.availableBalance?.toLocaleString("en-IN") || 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(seller.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border bg-muted text-foreground hover:bg-muted"
                          onClick={() => setEditing(seller)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        {(seller.sellerProfile?.status as string) === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const ok = await confirm({
                                title: `Deactivate seller ${seller.sellerProfile?.businessName || seller.email}?`,
                                description: "This blocks user login and deactivates their store and products.",
                                confirmLabel: "Deactivate",
                              });
                              if (ok) deleteSeller.mutate(seller._id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Deactivate
                          </Button>
                        )}
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
        page={params.page || 1}
        totalPages={1}
        onPage={(page) => setParam("page", page)}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Seller Account</DialogTitle>
          </DialogHeader>
          <SellerForm
            policies={policies}
            isPending={createSeller.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload) => createSeller.mutate(payload, { onSuccess: () => setIsCreateOpen(false) })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Seller Account</DialogTitle>
          </DialogHeader>
          {editing && (
            <SellerForm
              seller={editing}
              policies={policies}
              isPending={updateSeller.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload) =>
                updateSeller.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SellerForm({
  seller,
  policies,
  isPending,
  onCancel,
  onSubmit,
}: {
  seller?: any;
  policies: any[];
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (payload: any) => void;
}) {
  // User Account details
  const [fullName, setFullName] = useState(seller?.fullName || "");
  const [email, setEmail] = useState(seller?.email || "");
  const [phone, setPhone] = useState(seller?.phone || "");
  const [password, setPassword] = useState("");

  // Business Profile details
  const [businessName, setBusinessName] = useState(seller?.sellerProfile?.businessName || "");
  const [businessEmail, setBusinessEmail] = useState(seller?.sellerProfile?.businessEmail || seller?.email || "");
  const [businessPhone, setBusinessPhone] = useState(seller?.sellerProfile?.businessPhone || seller?.phone || "");
  const [gstin, setGstin] = useState(seller?.sellerProfile?.gstNumber || seller?.sellerProfile?.gstin || "");
  const [pan, setPan] = useState(seller?.sellerProfile?.pan || "");
  const [status, setStatus] = useState(seller?.sellerProfile?.status || "APPROVED");

  // Default Policy template configurations
  const [returnPolicyId, setReturnPolicyId] = useState(seller?.sellerProfile?.store?.policyRefs?.returnPolicy || "");
  const [refundPolicyId, setRefundPolicyId] = useState(seller?.sellerProfile?.store?.policyRefs?.refundPolicy || "");
  const [shippingPolicyId, setShippingPolicyId] = useState(seller?.sellerProfile?.store?.policyRefs?.shippingPolicy || "");
  const [termsPolicyId, setTermsPolicyId] = useState(seller?.sellerProfile?.store?.policyRefs?.termsPolicy || "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      // User account settings
      fullName,
      email,
      phone,
      ...(password ? { password } : {}),

      // Seller business settings
      businessName,
      businessEmail,
      businessPhone,
      gstin,
      pan,
      status,

      // Default policies setup for store
      policyRefs: {
        returnPolicy: returnPolicyId || undefined,
        refundPolicy: refundPolicyId || undefined,
        shippingPolicy: shippingPolicyId || undefined,
        termsPolicy: termsPolicyId || undefined,
      },
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 pt-2">
      <section className="grid gap-2 border-b border-border pb-3">
        <div className="text-xs font-semibold uppercase text-primary tracking-wide">Owner / User Account</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Full Name</span>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Aditya Kumar" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Login Email</span>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="aditya@example.com" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Contact Phone</span>
            <Input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 9876543210" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {seller ? "Change Password (Optional)" : "Login Password"}
            </span>
            <Input
              type="password"
              required={!seller}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-2 border-b border-border pb-3">
        <div className="text-xs font-semibold uppercase text-primary tracking-wide">Business Profile</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Business Name</span>
            <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="Bihar Apparel Co." />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Business Email</span>
            <Input required type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className={inputClass} placeholder="billing@biharapparel.com" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Business Phone</span>
            <Input required value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className={inputClass} placeholder="0612-2345678" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Seller Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="APPROVED">Approved — live seller</option>
              <option value="PENDING">Pending verification</option>
              <option value="REJECTED">Rejected</option>
              <option value="INACTIVE">Deactivated account</option>
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">GSTIN</span>
            <Input value={gstin} onChange={(e) => setGstin(e.target.value)} className={inputClass} placeholder="10AAAAA1111A1Z1" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">PAN Card Number</span>
            <Input value={pan} onChange={(e) => setPan(e.target.value)} className={inputClass} placeholder="ABCDE1234F" />
          </div>
        </div>
      </section>

      <section className="grid gap-2">
        <div className="text-xs font-semibold uppercase text-primary tracking-wide">Default Store Policies</div>
        <div className="text-xs text-muted-foreground pb-1">
          Select default policies for this seller's new store. Banners and products will reference these selections.
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Default Return Policy</span>
            <select value={returnPolicyId} onChange={(e) => setReturnPolicyId(e.target.value)} className={selectClass}>
              <option value="">No Return Policy</option>
              {policies
                .filter((p) => p.policyType === "RETURN")
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Default Refund Policy</span>
            <select value={refundPolicyId} onChange={(e) => setRefundPolicyId(e.target.value)} className={selectClass}>
              <option value="">No Refund Policy</option>
              {policies
                .filter((p) => p.policyType === "REFUND")
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Default Shipping Policy</span>
            <select value={shippingPolicyId} onChange={(e) => setShippingPolicyId(e.target.value)} className={selectClass}>
              <option value="">No Shipping Policy</option>
              {policies
                .filter((p) => p.policyType === "SHIPPING")
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Default Terms Policy</span>
            <select value={termsPolicyId} onChange={(e) => setTermsPolicyId(e.target.value)} className={selectClass}>
              <option value="">No Terms Policy</option>
              {policies
                .filter((p) => p.policyType === "TERMS")
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      <DialogFooter className="gap-2 pt-2 border-t border-border mt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save Seller
        </Button>
      </DialogFooter>
    </form>
  );
}
