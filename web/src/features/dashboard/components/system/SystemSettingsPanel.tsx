"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Settings, DatabaseBackup, Save } from "lucide-react";
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
import {
  AdminSystemConfig,
} from "../../api/adminManagement.api";
import {
  useSystemConfig,
  useUpdateSystemConfig,
  useActivityLogs,
  useAuditLogs,
  useBackups,
  useCreateBackup,
  useDryRunRestore,
  useRestoreBackup,
} from "../../hooks/useAdminManagement";
import {
  SectionHeader,
  TabButtons,
  StatusBadge,
  LoadingState,
  EmptyState,
} from "../shared/AdminFullHelpers";
import { inputClass, selectClass, formatDate } from "../../utils";

type SystemKind = "config" | "logs" | "backups";

const systemTabs: Array<{ id: SystemKind; label: string }> = [
  { id: "config", label: "Configuration" },
  { id: "logs", label: "Logs" },
  { id: "backups", label: "Backups" },
];

export function SystemSettingsPanel() {
  const [tab, setTab] = useState<SystemKind>("config");
  const [configDraft, setConfigDraft] = useState<AdminSystemConfig>({});
  const [logKind, setLogKind] = useState<"activity" | "audit">("activity");
  const [backupName, setBackupName] = useState("");
  const systemConfigQuery = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const activityQuery = useActivityLogs({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const auditQuery = useAuditLogs({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const backupsQuery = useBackups({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const createBackup = useCreateBackup();
  const dryRunRestore = useDryRunRestore();
  const restoreBackup = useRestoreBackup();

  useEffect(() => {
    if (systemConfigQuery.data) setConfigDraft(systemConfigQuery.data);
  }, [systemConfigQuery.data]);

  const saveConfig = (event: FormEvent) => {
    event.preventDefault();
    updateConfig.mutate(configDraft);
  };

  const logs =
    logKind === "activity"
      ? activityQuery.data?.data || []
      : auditQuery.data?.data || [];

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Settings className="h-4 w-4" />}
        title="System Settings"
        onRefresh={() => {
          systemConfigQuery.refetch();
          activityQuery.refetch();
          auditQuery.refetch();
          backupsQuery.refetch();
        }}
      />
      <TabButtons
        tabs={systemTabs}
        value={tab}
        onChange={(value) => setTab(value as SystemKind)}
      />
      {tab === "config" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <CardTitle className="text-white">Secure Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveConfig}>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  className={inputClass}
                  placeholder="API base URL"
                  value={configDraft.api?.baseUrl || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["api", "baseUrl"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="Payment provider"
                  value={configDraft.payment?.provider || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["payment", "provider"],
                      event.target.value
                    )
                  }
                />
                <select
                  className={selectClass}
                  value={configDraft.payment?.mode || "TEST"}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["payment", "mode"],
                      event.target.value
                    )
                  }
                >
                  <option value="TEST">Test Mode</option>
                  <option value="LIVE">Live Mode</option>
                </select>
                <Input
                  className={inputClass}
                  placeholder="Payment public key"
                  value={configDraft.payment?.publicKey || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["payment", "publicKey"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="Payment secret key"
                  value={configDraft.payment?.secretKey || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["payment", "secretKey"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="Webhook secret"
                  value={configDraft.payment?.webhookSecret || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["payment", "webhookSecret"],
                      event.target.value
                    )
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  className={inputClass}
                  placeholder="SMTP host"
                  value={configDraft.smtp?.host || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "host"],
                      event.target.value
                    )
                  }
                />
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="SMTP port"
                  value={configDraft.smtp?.port || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "port"],
                      Number(event.target.value || 0)
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="SMTP username"
                  value={configDraft.smtp?.username || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "username"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="SMTP password"
                  value={configDraft.smtp?.password || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "password"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="From email"
                  value={configDraft.smtp?.fromEmail || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "fromEmail"],
                      event.target.value
                    )
                  }
                />
                <Input
                  className={inputClass}
                  placeholder="From name"
                  value={configDraft.smtp?.fromName || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["smtp", "fromName"],
                      event.target.value
                    )
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className={selectClass}
                  value={configDraft.backup?.frequency || "WEEKLY"}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["backup", "frequency"],
                      event.target.value
                    )
                  }
                >
                  <option value="DAILY">Daily Backups</option>
                  <option value="WEEKLY">Weekly Backups</option>
                  <option value="MONTHLY">Monthly Backups</option>
                </select>
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="Retention days"
                  value={configDraft.backup?.retentionDays || ""}
                  onChange={(event) =>
                    updateNestedConfig(
                      setConfigDraft,
                      ["backup", "retentionDays"],
                      Number(event.target.value || 0)
                    )
                  }
                />
                <Button
                  type="submit"
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {tab === "logs" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-white">Activity & Audit Logs</CardTitle>
              <div className="flex gap-2">
                <ToggleButton
                  active={logKind === "activity"}
                  label="Activity"
                  onClick={() => setLogKind("activity")}
                />
                <ToggleButton
                  active={logKind === "audit"}
                  label="Audit"
                  onClick={() => setLogKind("audit")}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {(activityQuery.isLoading || auditQuery.isLoading) && (
              <LoadingState label="Loading logs..." />
            )}
            {!logs.length && <EmptyState label="No logs found." />}
            {Boolean(logs.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Action</TableHead>
                    <TableHead className="text-gray-400">Resource</TableHead>
                    <TableHead className="text-gray-400">Actor</TableHead>
                    <TableHead className="text-gray-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log._id}
                      className="border-white/10 hover:bg-white/[0.03]"
                    >
                      <TableCell className="px-4 text-sm text-white">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">
                        {log.resourceType}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {typeof log.actorId === "object"
                          ? log.actorId.fullName || log.actorId.email
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      {tab === "backups" && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-white">Backup & Restore</CardTitle>
              <div className="flex gap-2">
                <Input
                  className={inputClass}
                  placeholder="Backup name"
                  value={backupName}
                  onChange={(event) => setBackupName(event.target.value)}
                />
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  onClick={() =>
                    createBackup.mutate(
                      { name: backupName || undefined },
                      { onSuccess: () => setBackupName("") }
                    )
                  }
                >
                  <DatabaseBackup className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {backupsQuery.isLoading && <LoadingState label="Loading backups..." />}
            {!backupsQuery.isLoading && !backupsQuery.data?.data?.length && (
              <EmptyState label="No backups found." />
            )}
            {Boolean(backupsQuery.data?.data?.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Backup</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Collections</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupsQuery.data?.data.map((backup) => (
                    <TableRow
                      key={backup._id}
                      className="border-white/10 hover:bg-white/[0.03]"
                    >
                      <TableCell className="px-4">
                        <div className="text-sm font-medium text-white">
                          {backup.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(backup.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={backup.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {backup.collections?.length || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => dryRunRestore.mutate(backup._id)}
                          >
                            Dry Run
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                            onClick={() =>
                              window.confirm("Restore this backup?") &&
                              restoreBackup.mutate(backup._id)
                            }
                          >
                            Restore
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
      )}
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
      }
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function updateNestedConfig(
  setter: React.Dispatch<React.SetStateAction<AdminSystemConfig>>,
  path: string[],
  value: any
) {
  setter((current) => {
    const next: any = { ...current };
    let cursor = next;
    path.slice(0, -1).forEach((key) => {
      cursor[key] = { ...(cursor[key] || {}) };
      cursor = cursor[key];
    });
    cursor[path[path.length - 1]] = value;
    return next;
  });
}
