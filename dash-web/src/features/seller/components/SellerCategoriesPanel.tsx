"use client";

import React, { type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useSellerCategories,
  useSellerCategoryRequest,
} from "../hooks/useSellerManagement";
import {
  StatusTile,
  SimpleTable,
  StatusBadge,
  Field,
  selectClass,
  labelClass,
  text,
} from "./SellerHelpers";

export function SellerCategoriesPanel() {
  const categoriesQuery = useSellerCategories();
  const requestCategory = useSellerCategoryRequest();
  const availableCategories =
    categoriesQuery.data?.available.filter((category) => category.isActive !== false) || [];

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    requestCategory.mutate({
      requestedPrimaryCategory: text(form, "requestedPrimaryCategory"),
      requestedSubcategories: formValues(form, "requestedSubcategories"),
      message: text(form, "message"),
    });
  };

  const formValues = (form: FormData, name: string) => {
    return form
      .getAll(name)
      .map((value) => String(value).trim())
      .filter(Boolean);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Assigned Categories</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4">
          <StatusTile
            title="Primary"
            label={categoriesQuery.data?.assigned?.primaryCategory || "Not assigned"}
            active={Boolean(categoriesQuery.data?.assigned?.primaryCategory)}
          />
          <div className="flex flex-wrap gap-2">
            {(categoriesQuery.data?.assigned?.subcategories || []).map((item) => (
              <Badge key={item} variant="outline" className="border-emerald-400/30 text-emerald-300">
                {item}
              </Badge>
            ))}
          </div>
          <SimpleTable
            empty="No category requests."
            columns={["Requested", "Status", "Reason"]}
            rows={(categoriesQuery.data?.requests || []).map((request) => [
              [request.requestedPrimaryCategory, ...(request.requestedSubcategories || [])].join(" / "),
              <StatusBadge key={request._id} label={request.status} />,
              request.rejectionReason || "-",
            ])}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Category Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={submitRequest} className="grid gap-3">
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                Primary Category
                <span className="text-[10px] normal-case text-red-300">Required</span>
              </span>
              <select name="requestedPrimaryCategory" required className={selectClass}>
                <option value="">Select category</option>
                {availableCategories.map((category) => (
                  <option key={category._id} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                Subcategories
                <span className="text-[10px] normal-case text-gray-500">Optional</span>
              </span>
              <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-[#181818] p-2">
                {availableCategories.length ? (
                  availableCategories.map((category) => (
                    <label
                      key={category._id}
                      className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.03] px-2 py-1.5 text-xs normal-case text-gray-300"
                    >
                      <input type="checkbox" name="requestedSubcategories" value={category.title} />
                      {category.title}
                    </label>
                  ))
                ) : (
                  <div className="text-xs normal-case text-gray-500">No active categories available.</div>
                )}
              </div>
            </label>
            <Field name="message" label="Message" optional />
            <Button type="submit" disabled={requestCategory.isPending || !availableCategories.length}>
              <Send className="h-4 w-4" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
