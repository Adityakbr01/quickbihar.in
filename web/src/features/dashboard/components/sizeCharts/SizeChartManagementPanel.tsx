"use client";

import React, { type FormEvent, useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  useAdminSizeCharts,
  useCreateAdminSizeChart,
  useUpdateAdminSizeChart,
  useDeleteAdminSizeChart,
} from "../../hooks/useCatalogManagement";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
} from "../shared/TableHelpers";
import { selectClass, inputClass, formatDate } from "../../utils";

export function SizeChartManagementPanel() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const chartsQuery = useAdminSizeCharts();
  const createChart = useCreateAdminSizeChart();
  const updateChart = useUpdateAdminSizeChart();
  const deleteChart = useDeleteAdminSizeChart();

  const charts = chartsQuery.data || [];

  const filteredCharts = charts.filter(
    (chart) =>
      chart.name.toLowerCase().includes(search.toLowerCase()) ||
      chart.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Global Size Charts"
        search={search}
        onSearch={setSearch}
        status="all"
        statuses={[{ value: "all", label: "All Statuses" }]}
        onStatus={() => {}}
        sortBy="name"
        sortOptions={[{ value: "name", label: "Name" }]}
        onSortBy={() => {}}
        sortOrder="asc"
        onSortOrder={() => {}}
        onRefresh={() => chartsQuery.refetch()}
        extraAction={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Size Chart
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {chartsQuery.isLoading && <LoadingState label="Loading size charts..." />}
          {!chartsQuery.isLoading && !filteredCharts.length && <EmptyState label="No size charts found." />}
          {!chartsQuery.isLoading && Boolean(filteredCharts.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Unit</TableHead>
                  <TableHead className="text-gray-400">Fields</TableHead>
                  <TableHead className="text-gray-400">Updated</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharts.map((chart) => (
                  <TableRow key={chart._id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="px-4">
                      <div className="font-medium text-white">{chart.name}</div>
                      <div className="text-xs text-gray-500">{(chart as any).scope || "GLOBAL"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-300">{chart.category}</TableCell>
                    <TableCell className="text-sm text-gray-300">{chart.unit}</TableCell>
                    <TableCell className="text-sm text-gray-400">{chart.fields?.join(", ") || "-"}</TableCell>
                    <TableCell className="text-sm text-gray-400">{formatDate((chart as any).updatedAt || (chart as any).createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => setEditing(chart)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete size chart ${chart.name}?`)) deleteChart.mutate(chart._id);
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Size Chart</DialogTitle>
          </DialogHeader>
          <SizeChartForm
            isPending={createChart.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload) => createChart.mutate(payload, { onSuccess: () => setIsCreateOpen(false) })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Size Chart</DialogTitle>
          </DialogHeader>
          {editing && (
            <SizeChartForm
              chart={editing}
              isPending={updateChart.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload) =>
                updateChart.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SizeChartForm({
  chart,
  isPending,
  onCancel,
  onSubmit,
}: {
  chart?: any;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (payload: any) => void;
}) {
  const [name, setName] = useState(chart?.name || "");
  const [category, setCategory] = useState(chart?.category || "Shirts");
  const [unit, setUnit] = useState(chart?.unit || "inches");
  const [fields, setFields] = useState(chart?.fields?.join(", ") || "size, chest, length, shoulder");
  const [howToMeasure, setHowToMeasure] = useState(chart?.howToMeasure?.join(", ") || "");
  const [data, setData] = useState(
    chart?.data ? JSON.stringify(chart.data, null, 2) : '[\n  { "size": "M", "chest": 40, "length": 28, "shoulder": 18 },\n  { "size": "L", "chest": 42, "length": 29, "shoulder": 19 }\n]'
  );
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    let parsedData;
    try {
      parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw new Error("Rows must be a JSON array.");
      }
    } catch (e: any) {
      setError(`Invalid JSON rows: ${e.message}`);
      return;
    }

    onSubmit({
      name,
      category,
      unit,
      fields: fields.split(",").map((f: string) => f.trim()).filter(Boolean),
      howToMeasure: howToMeasure ? howToMeasure.split(",").map((m: string) => m.trim()).filter(Boolean) : [],
      data: parsedData,
      scope: "GLOBAL",
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 pt-2">
      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase text-gray-400">Chart Template Name</span>
        <Input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Men's Tops Chart" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-500">Clothing Category</span>
          <Input required value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Shirts" />
        </div>

        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase text-gray-500">Measurement Unit</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectClass}>
            <option value="inches">Inches (in)</option>
            <option value="cm">Centimeters (cm)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase text-gray-500">Header Columns (Comma separated)</span>
        <Input required value={fields} onChange={(e) => setFields(e.target.value)} className={inputClass} placeholder="size, chest, length" />
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase text-gray-500">Measurement Tips (Comma separated)</span>
        <Input value={howToMeasure} onChange={(e) => setHowToMeasure(e.target.value)} className={inputClass} placeholder="Measure chest around fullest part..." />
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase text-gray-500">Data Grid (JSON Array)</span>
        <textarea
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="min-h-36 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white outline-none font-mono"
        />
      </div>

      {error && <div className="text-xs text-red-300">{error}</div>}

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save Size Chart
        </Button>
      </DialogFooter>
    </form>
  );
}
