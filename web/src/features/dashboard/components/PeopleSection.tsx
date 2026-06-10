"use client";

import {
  Ban,
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inputClass, selectClass, roleOptions, statusOptions } from "./types";
import { getPartner } from "./utils";
import type { RoleFilter, StatusFilter } from "./types";
import type {
  ManagedPerson,
  PartnerType,
} from "@/features/dashboard/api/adminManagement.api";
import { RoleBadge, StatusBadge } from "./badges";

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
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base text-white">People</CardTitle>
        <div className="grid gap-2 md:grid-cols-[240px_140px_140px]">
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
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <PeopleTable
          people={people}
          isLoading={isLoading}
          onBlock={onBlock}
          onPartnerStatus={onPartnerStatus}
        />
      </CardContent>
    </Card>
  );
}

function PeopleTable({
  people,
  isLoading,
  onBlock,
  onPartnerStatus,
}: {
  people: ManagedPerson[];
  isLoading: boolean;
  onBlock: (person: ManagedPerson) => void;
  onPartnerStatus: (
    person: ManagedPerson,
    type: PartnerType,
    status: "APPROVED" | "REJECTED",
  ) => void;
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-10 text-sm text-gray-400">Loading people...</div>
    );
  }

  if (!people.length) {
    return (
      <div className="px-4 py-10 text-sm text-gray-400">No people found.</div>
    );
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
          return (
            <TableRow
              key={person._id}
              className="border-white/10 hover:bg-white/[0.03]"
            >
              <TableCell className="px-4">
                <div className="font-medium text-white">{person.fullName}</div>
                <div className="text-xs text-gray-500">{person.email}</div>
              </TableCell>
              <TableCell>
                <RoleBadge role={person.role} />
              </TableCell>
              <TableCell>
                {partner ? (
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="border-white/10 text-gray-300"
                    >
                      {partner.type}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {partner.profile.businessName ||
                        partner.profile.vehicleNumber ||
                        "Profile"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                {person.sellerProfile?.mallName ? (
                  <div className="space-y-1">
                    <div className="text-sm text-white">
                      {person.sellerProfile.mallName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {[
                        person.sellerProfile.mallUnit,
                        person.sellerProfile.mallFloor,
                      ]
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
                  <StatusBadge
                    active={!person.isBlocked}
                    label={person.isBlocked ? "Blocked" : "Active"}
                  />
                  {partner && (
                    <StatusBadge
                      active={partner.profile.status === "APPROVED"}
                      label={partner.profile.status}
                    />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {partner && partner.profile.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() =>
                        onPartnerStatus(person, partner.type, "APPROVED")
                      }
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
                      onClick={() =>
                        onPartnerStatus(person, partner.type, "REJECTED")
                      }
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
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
