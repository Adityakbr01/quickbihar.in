import React, { type FormEvent, useState } from "react";
import { Plus, Edit, Trash2, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  useAdminPolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from "../../hooks/useAdminManagement";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared/TableHelpers";
import { selectClass, inputClass, textareaClass, formatDate } from "../../utils";
import type { AdminListParams } from "../../api/adminManagement.api";

export function PolicyManagementPanel() {
  const confirm = useConfirm();
  const [params, setParams] = useState<AdminListParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const policiesQuery = useAdminPolicies(params);
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

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
        title="Global Policies"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All Statuses" },
          { value: "true", label: "Active Only" },
          { value: "false", label: "Inactive Only" },
        ]}
        onStatus={(value) => setParam("status", value === "all" ? undefined : value)}
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created Date" },
          { value: "name", label: "Name" },
          { value: "policyType", label: "Policy Type" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => policiesQuery.refetch()}
        extraAction={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Policy
          </Button>
        }
      />

      <Card className="border-border bg-card">
        <CardContent className="px-0">
          {policiesQuery.isLoading && <LoadingState label="Loading policies..." />}
          {!policiesQuery.isLoading && !policies.length && <EmptyState label="No policies found." />}
          {!policiesQuery.isLoading && Boolean(policies.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-4 text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Is Default</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Updated</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy._id} className="border-border hover:bg-muted">
                    <TableCell className="px-4">
                      <div className="font-medium text-foreground">{policy.name}</div>
                      <div className="line-clamp-1 max-w-xs text-xs text-muted-foreground">{policy.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-400/30 text-cyan-700 dark:text-cyan-300">
                        {policy.policyType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(policy.isDefault)} label={policy.isDefault ? "Default" : "Custom"} />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          updatePolicy.mutate({ id: policy._id, payload: { isActive: !policy.isActive } })
                        }
                      >
                        <StatusBadge active={Boolean(policy.isActive)} label={policy.isActive ? "Active" : "Inactive"} />
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(policy.updatedAt || policy.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border bg-muted text-foreground hover:bg-muted"
                          onClick={() => setEditing(policy)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Delete policy ${policy.name}?`,
                              description: "Stores using this policy will be affected.",
                              confirmLabel: "Delete",
                            });
                            if (ok) deletePolicy.mutate(policy._id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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
        page={params.page || 1}
        totalPages={policiesQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Policy</DialogTitle>
          </DialogHeader>
          <PolicyForm
            isPending={createPolicy.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload) => createPolicy.mutate(payload, { onSuccess: () => setIsCreateOpen(false) })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
          </DialogHeader>
          {editing && (
            <PolicyForm
              policy={editing}
              isPending={updatePolicy.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload) =>
                updatePolicy.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PolicyForm({
  policy,
  isPending,
  onCancel,
  onSubmit,
}: {
  policy?: any;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (payload: any) => void;
}) {
  const [name, setName] = useState(policy?.name || "");
  const [policyType, setPolicyType] = useState(policy?.policyType || "RETURN");
  const [description, setDescription] = useState(policy?.description || "");
  const [isDefault, setIsDefault] = useState(policy?.isDefault ?? false);
  const [isActive, setIsActive] = useState(policy?.isActive ?? true);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name, policyType, description, isDefault, isActive });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 pt-2">
      <div className="grid gap-1.5">
        <span className="text-xs font-medium uppercase text-muted-foreground">Policy Name</span>
        <Input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Return Policy - 7 Days" />
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs font-medium uppercase text-muted-foreground">Policy Type</span>
        <select value={policyType} onChange={(e) => setPolicyType(e.target.value)} className={selectClass}>
          <option value="RETURN">Return Policy</option>
          <option value="REFUND">Refund Policy</option>
          <option value="SHIPPING">Shipping Policy</option>
          <option value="TERMS">Terms Policy</option>
        </select>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs font-medium uppercase text-muted-foreground">Policy Description</span>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} placeholder="Write detail policy description..." />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
        <div className="grid gap-0.5">
          <div className="font-medium">Default Policy</div>
          <div className="text-xs text-muted-foreground">Enable this as the default fallback option for newly registered store templates.</div>
        </div>
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
        <div className="grid gap-0.5">
          <div className="font-medium">Active Status</div>
          <div className="text-xs text-muted-foreground">Enable or disable policy visibility. Inactive policies cannot be selected by sellers.</div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Policy
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
