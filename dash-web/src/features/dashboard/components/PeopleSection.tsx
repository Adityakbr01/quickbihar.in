"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Edit,
  Eye,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { inputClass, selectClass, roleOptions, statusOptions } from "./types";
import { formatDateTime, getPartner, optionalValue } from "./utils";
import type { RoleFilter, StatusFilter } from "./types";
import type {
  AdminRole,
  AdminUserPayload,
  ManagedPerson,
  PartnerType,
} from "@/features/dashboard/api/adminManagement.api";
import {
  useAdminUser,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from "@/features/dashboard/hooks/useAdminManagement";
import { RoleBadge, StatusBadge } from "./badges";

const userRoleOptions = roleOptions.filter((role) => role !== "ALL") as AdminRole[];

export function PeopleSection({
  people,
  isLoading,
  search,
  role,
  status,
  onSearch,
  onRole,
  onStatus,
  onBlock,
  onPartnerStatus,
}: {
  people: ManagedPerson[];
  isLoading: boolean;
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  onSearch: (value: string) => void;
  onRole: (value: RoleFilter) => void;
  onStatus: (value: StatusFilter) => void;
  onBlock: (person: ManagedPerson) => void;
  onPartnerStatus: (
    person: ManagedPerson,
    type: PartnerType,
    status: "APPROVED" | "REJECTED",
  ) => void;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<ManagedPerson | null>(null);
  const [editing, setEditing] = useState<ManagedPerson | null>(null);
  const [deleting, setDeleting] = useState<ManagedPerson | null>(null);
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-4 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base text-white">People</CardTitle>
          <div className="mt-1 text-xs text-gray-500">
            Create, view, edit, deactivate, verify, and control access for user accounts.
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-[220px_140px_140px_auto]">
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search people"
            className={inputClass}
          />
          <select
            value={role}
            onChange={(event) => onRole(event.target.value as RoleFilter)}
            className={selectClass}
          >
            {roleOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => onStatus(event.target.value as StatusFilter)}
            className={selectClass}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <PeopleTable
          people={people}
          isLoading={isLoading}
          onView={setViewing}
          onEdit={setEditing}
          onDelete={setDeleting}
          onBlock={onBlock}
          onPartnerStatus={onPartnerStatus}
        />
      </CardContent>

      <UserFormDialog
        open={isCreateOpen}
        title="Add User"
        isPending={createUser.isPending}
        onOpenChange={setIsCreateOpen}
        onSubmit={(payload) =>
          createUser.mutate(payload, {
            onSuccess: () => setIsCreateOpen(false),
          })
        }
      />

      {editing && (
        <UserFormDialog
          open
          title="Edit User"
          person={editing}
          isPending={updateUser.isPending}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={(payload) =>
            updateUser.mutate(
              { id: editing._id, payload },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}

      {viewing && (
        <UserDetailDialog
          person={viewing}
          onOpenChange={(open) => !open && setViewing(null)}
        />
      )}

      {deleting && (
        <DeleteUserDialog
          person={deleting}
          isPending={deleteUser.isPending}
          onOpenChange={(open) => !open && setDeleting(null)}
          onDelete={(deletionReason) =>
            deleteUser.mutate(
              { id: deleting._id, deletionReason },
              { onSuccess: () => setDeleting(null) },
            )
          }
        />
      )}
    </Card>
  );
}

function PeopleTable({
  people,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onBlock,
  onPartnerStatus,
}: {
  people: ManagedPerson[];
  isLoading: boolean;
  onView: (person: ManagedPerson) => void;
  onEdit: (person: ManagedPerson) => void;
  onDelete: (person: ManagedPerson) => void;
  onBlock: (person: ManagedPerson) => void;
  onPartnerStatus: (
    person: ManagedPerson,
    type: PartnerType,
    status: "APPROVED" | "REJECTED",
  ) => void;
}) {
  if (isLoading) {
    return <div className="px-4 py-10 text-sm text-gray-400">Loading people...</div>;
  }

  if (!people.length) {
    return <div className="px-4 py-10 text-sm text-gray-400">No people found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="px-4 text-gray-400">Name</TableHead>
          <TableHead className="text-gray-400">Role</TableHead>
          <TableHead className="text-gray-400">Partner</TableHead>
          <TableHead className="text-gray-400">Mall</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-right text-gray-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => {
          const partner = getPartner(person);
          const isDeleted = Boolean(person.deletedAt);
          return (
            <TableRow
              key={person._id}
              className={cn(
                "border-white/10 hover:bg-white/[0.03]",
                isDeleted && "bg-red-500/[0.03] opacity-75",
              )}
            >
              <TableCell className="px-4">
                <div className="font-medium text-white">{person.fullName}</div>
                <div className="text-xs text-gray-500">{person.email}</div>
                <div className="text-xs text-gray-600">@{person.username}</div>
              </TableCell>
              <TableCell>
                <RoleBadge role={person.role} />
              </TableCell>
              <TableCell>
                {partner ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="border-white/10 text-gray-300">
                      {partner.type}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {partner.profile.businessName || partner.profile.vehicleNumber || "Profile"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                {person.sellerProfile?.mallName ? (
                  <div className="space-y-1">
                    <div className="text-sm text-white">{person.sellerProfile.mallName}</div>
                    <div className="text-xs text-gray-500">
                      {[person.sellerProfile.mallUnit, person.sellerProfile.mallFloor]
                        .filter(Boolean)
                        .join(" / ") || "Assigned"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {isDeleted && <StatusBadge active={false} label="Deleted" />}
                  <StatusBadge active={!person.isBlocked} label={person.isBlocked ? "Blocked" : "Active"} />
                  <StatusBadge active={person.isVerified} label={person.isVerified ? "Verified" : "Unverified"} />
                  {partner && (
                    <StatusBadge
                      active={partner.profile.status === "APPROVED"}
                      label={partner.profile.status}
                    />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => onView(person)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => onEdit(person)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {partner && partner.profile.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => onPartnerStatus(person, partner.type, "APPROVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  )}
                  {partner && partner.profile.status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-300 hover:bg-white/10 hover:text-white"
                      onClick={() => onPartnerStatus(person, partner.type, "REJECTED")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={person.isBlocked ? "outline" : "destructive"}
                    className={
                      person.isBlocked
                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        : ""
                    }
                    onClick={() => onBlock(person)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {person.isBlocked ? "Unban" : "Ban"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isDeleted}
                    onClick={() => onDelete(person)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function UserFormDialog({
  open,
  title,
  person,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  person?: ManagedPerson;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminUserPayload) => void;
}) {
  const [fullName, setFullName] = useState(person?.fullName || "");
  const [email, setEmail] = useState(person?.email || "");
  const [username, setUsername] = useState(person?.username || "");
  const [phone, setPhone] = useState(person?.phone || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>((person?.role || "USER") as AdminRole);
  const [isVerified, setIsVerified] = useState(person?.isVerified ?? true);
  const [isBlocked, setIsBlocked] = useState(person?.isBlocked ?? false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      fullName,
      email,
      username: optionalValue(username),
      phone: optionalValue(phone),
      role,
      isVerified,
      isBlocked,
      ...(password ? { password } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name">
              <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Username">
              <Input value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} placeholder="Auto from email" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
            </Field>
            <Field label={person ? "New password" : "Password"}>
              <Input
                type="password"
                required={!person}
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder={person ? "Leave blank to keep current" : ""}
              />
            </Field>
            <Field label="Role">
              <select value={role} onChange={(event) => setRole(event.target.value as AdminRole)} className={selectClass}>
                {userRoleOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Verification">
              <select
                value={isVerified ? "verified" : "unverified"}
                onChange={(event) => setIsVerified(event.target.value === "verified")}
                className={selectClass}
              >
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </Field>
            <Field label="Access">
              <select
                value={isBlocked ? "blocked" : "active"}
                onChange={(event) => setIsBlocked(event.target.value === "blocked")}
                className={selectClass}
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </Field>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">
            Seller and rider roles automatically create a pending partner profile.
          </div>
          <DialogFooter className="border-white/10 bg-transparent">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              Save User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailDialog({
  person,
  onOpenChange,
}: {
  person: ManagedPerson;
  onOpenChange: (open: boolean) => void;
}) {
  const userQuery = useAdminUser(person._id);
  const detail = userQuery.data || person;
  const partner = getPartner(detail);
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <DetailBox label="Name" value={detail.fullName} />
          <DetailBox label="Email" value={detail.email} />
          <DetailBox label="Username" value={`@${detail.username}`} />
          <DetailBox label="Phone" value={detail.phone || "-"} />
          <DetailBox label="Role" value={detail.role} />
          <DetailBox label="Verified" value={detail.isVerified ? "Yes" : "No"} />
          <DetailBox label="Blocked" value={detail.isBlocked ? "Yes" : "No"} />
          <DetailBox label="Created" value={formatDateTime(detail.createdAt)} />
          {detail.deletedAt && <DetailBox label="Deleted" value={formatDateTime(detail.deletedAt)} />}
          {detail.deletionReason && <DetailBox label="Delete reason" value={detail.deletionReason} />}
          {partner && (
            <DetailBox
              label="Partner profile"
              value={`${partner.type} / ${partner.profile.status}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  person,
  isPending,
  onOpenChange,
  onDelete,
}: {
  person: ManagedPerson;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (deletionReason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
            This soft delete blocks login and preserves user orders, payouts, and audit history.
          </div>
          <DetailBox label="User" value={`${person.fullName} / ${person.email}`} />
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <DialogFooter className="border-white/10 bg-transparent">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={() => onDelete(optionalValue(reason))}>
              <Trash2 className="h-4 w-4" />
              Deactivate
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function DetailBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm text-white">{value}</div>
    </div>
  );
}
