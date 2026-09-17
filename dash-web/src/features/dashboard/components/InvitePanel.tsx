"use client";

import { type FormEvent, useState } from "react";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { selectClass, inputClass } from "./types";
import { optionalValue } from "./utils";
import { useSendInvite } from "@/features/dashboard/hooks/useAdminManagement";
import type { AdminRole } from "@/features/dashboard/api/adminManagement.api";

export function InvitePanel() {
  const sendInvite = useSendInvite();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("SELLER");
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendInvite.mutate(
      {
        email,
        fullName: optionalValue(fullName),
        role,
        message: optionalValue(message),
      },
      {
        onSuccess: () => {
          setEmail("");
          setFullName("");
          setMessage("");
        },
      },
    );
  };

  return (
    <Card className="max-w-xl border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <MailPlus className="h-4 w-4 text-emerald-300" />
          Invite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
            className={inputClass}
          />
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Name"
            className={inputClass}
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
            className={selectClass}
          >
            <option value="SELLER">SELLER</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <Button type="submit" disabled={sendInvite.isPending}>
            <MailPlus className="h-4 w-4" />
            Send Invite
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
