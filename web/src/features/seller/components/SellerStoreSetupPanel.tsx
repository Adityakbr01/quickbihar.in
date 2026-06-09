"use client";

import React, { type FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useSellerStore,
  useSellerCategories,
  useSaveSellerStore,
  useToggleSellerStoreOpen,
  useSellerPolicies,
} from "../hooks/useSellerManagement";
import {
  StatusTile,
  Field,
  LoadingState,
  selectClass,
  labelClass,
  inputClass,
  text,
  numberValue,
  list,
  files,
} from "./SellerHelpers";

export function SellerStoreSetupPanel() {
  const storeQuery = useSellerStore();
  const categoriesQuery = useSellerCategories();
  const saveStore = useSaveSellerStore();
  const toggleOpen = useToggleSellerStoreOpen();
  const refundPoliciesQuery = useSellerPolicies();

  const store = storeQuery.data?.store;
  const missingFields = storeQuery.data?.setup.missingFields || [];
  const availableCategories =
    categoriesQuery.data?.available.filter((category) => category.isActive !== false) || [];
  const categoryLocked = Boolean(
    store?.categoryConfig?.primaryCategory || store?.categoryConfig?.subcategories?.length
  );
  const savedSubcategories = store?.categoryConfig?.subcategories || [];
  const refundPolicies = refundPoliciesQuery.data || [];

  const [returnPolicyId, setReturnPolicyId] = useState(store?.policyRefs?.returnPolicy || "");
  const [refundPolicyId, setRefundPolicyId] = useState(store?.policyRefs?.refundPolicy || "");
  const [shippingPolicyId, setShippingPolicyId] = useState(store?.policyRefs?.shippingPolicy || "");
  const [termsPolicyId, setTermsPolicyId] = useState(store?.policyRefs?.termsPolicy || "");

  const submitStore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const primaryCategory = text(form, "primaryCategory");
    const subcategories = formValues(form, "subcategories");

    saveStore.mutate({
      name: text(form, "name"),
      description: text(form, "description"),
      logoUrl: text(form, "logoUrl"),
      bannerUrl: text(form, "bannerUrl"),
      address: {
        line1: text(form, "line1"),
        city: text(form, "city"),
        state: text(form, "state"),
        pincode: text(form, "pincode"),
        country: text(form, "country") || "India",
        postalCode: text(form, "postalCode"),
      },
      contact: {
        email: text(form, "email"),
        phone: text(form, "phone"),
      },
      ...(!categoryLocked
        ? {
            categoryConfig: {
              primaryCategory,
              subcategories,
            },
          }
        : {}),
      deliveryConfig: {
        deliveryAreas: list(text(form, "deliveryAreas")),
        shippingFee: numberValue(form, "shippingFee"),
        freeShippingThreshold: numberValue(form, "freeShippingThreshold"),
      },
      seo: {
        storeTitle: text(form, "storeTitle"),
        metaTitle: text(form, "metaTitle"),
        metaDescription: text(form, "metaDescription"),
      },
      policyRefs: {
        returnPolicy: returnPolicyId || undefined,
        refundPolicy: refundPolicyId || undefined,
        shippingPolicy: shippingPolicyId || undefined,
        termsPolicy: termsPolicyId || undefined,
      },
    });
  };

  const formValues = (form: FormData, name: string) => {
    return form
      .getAll(name)
      .map((value) => String(value).trim())
      .filter(Boolean);
  };

  if (storeQuery.isLoading || categoriesQuery.isLoading)
    return <LoadingState label="Loading store..." />;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-3">
        <StatusTile title="Store" label={store?.name || "No store"} active={Boolean(store)} />
        <StatusTile
          title="Configuration"
          label={store?.isSetupComplete ? "Complete" : "Incomplete"}
          active={Boolean(store?.isSetupComplete)}
        />
        <StatusTile title="Availability" label={store?.isOpen ? "Open" : "Closed"} active={Boolean(store?.isOpen)} />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
            <span>Store Configuration</span>
            {store && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => toggleOpen.mutate(!store.isOpen)}
              >
                {store.isOpen ? "Close Store" : "Open Store"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form key={store?._id || "new-store"} onSubmit={submitStore} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="name" label="Store Name" defaultValue={store?.name} required />
              <Field name="email" label="Email" defaultValue={store?.contact?.email} />
              <Field name="phone" label="Phone" defaultValue={store?.contact?.phone} />
              <Field name="deliveryAreas" label="Delivery Areas" defaultValue={(store?.deliveryConfig?.deliveryAreas || []).join(", ")} />
              <Field name="shippingFee" label="Shipping Fee" type="number" defaultValue={store?.deliveryConfig?.shippingFee} />
              <Field name="freeShippingThreshold" label="Free Shipping Above" type="number" defaultValue={store?.deliveryConfig?.freeShippingThreshold} />
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Store Categories</div>
                  <div className="text-xs text-gray-500">
                    Sellers can choose only admin-created categories. Saved categories are locked; admin can change them after review.
                  </div>
                </div>
                {categoryLocked && (
                  <Badge variant="outline" className="border-amber-400/30 text-amber-300">
                    Locked
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr]">
                <label className={labelClass}>
                  Primary Category
                  <select
                    name="primaryCategory"
                    defaultValue={store?.categoryConfig?.primaryCategory || ""}
                    required={!categoryLocked}
                    disabled={categoryLocked}
                    className={selectClass}
                  >
                    <option value="">Select category</option>
                    {availableCategories.map((category) => (
                      <option key={category._id} value={category.title}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Subcategories
                  <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-[#181818] p-2 md:grid-cols-2">
                    {availableCategories.length ? (
                      availableCategories.map((category) => (
                        <label
                          key={category._id}
                          className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.03] px-2 py-1.5 text-xs normal-case text-gray-300"
                        >
                          <input
                            type="checkbox"
                            name="subcategories"
                            value={category.title}
                            defaultChecked={savedSubcategories.some(
                              (value) => categoryKey(value) === categoryKey(category.title)
                            )}
                            disabled={categoryLocked}
                          />
                          {category.title}
                        </label>
                      ))
                    ) : (
                      <div className="text-xs normal-case text-gray-500">
                        No active categories available. Ask admin to create categories first.
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="logoUrl" label="Logo URL" defaultValue={store?.logoUrl} />
              <Field name="bannerUrl" label="Banner URL" defaultValue={store?.bannerUrl} />
              <Field name="line1" label="Address" defaultValue={store?.address?.line1} />
              <Field name="city" label="City" defaultValue={store?.address?.city} />
              <Field name="state" label="State" defaultValue={store?.address?.state} />
              <Field name="pincode" label="Pincode" defaultValue={store?.address?.pincode} />
              <Field name="country" label="Country" defaultValue={store?.address?.country || "India"} />
              <Field name="postalCode" label="Postal Code" defaultValue={store?.address?.postalCode} />
            </div>

            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-white">Default Store Policies</div>
              <div className="text-xs text-gray-500">
                Select default policies. Product listings will inherit these options unless overridden.
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className={labelClass}>
                  Return Policy
                  <select
                    value={returnPolicyId}
                    onChange={(e) => setReturnPolicyId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">No Return Policy</option>
                    {refundPolicies
                      .filter((p) => p.policyType === "RETURN")
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Refund Policy
                  <select
                    value={refundPolicyId}
                    onChange={(e) => setRefundPolicyId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">No Refund Policy</option>
                    {refundPolicies
                      .filter((p) => p.policyType === "REFUND")
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Shipping Policy
                  <select
                    value={shippingPolicyId}
                    onChange={(e) => setShippingPolicyId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">No Shipping Policy</option>
                    {refundPolicies
                      .filter((p) => p.policyType === "SHIPPING")
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Terms Policy
                  <select
                    value={termsPolicyId}
                    onChange={(e) => setTermsPolicyId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">No Terms Policy</option>
                    {refundPolicies
                      .filter((p) => p.policyType === "TERMS")
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-white">Legacy Policies (Read-Only)</div>
              <div className="text-xs text-gray-500">
                Legacy store policy description fields. These are read-only fallbacks.
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Field
                  name="returnPolicy"
                  label="Legacy Return Policy text"
                  defaultValue={store?.policies?.returnPolicy}
                  disabled
                />
                <Field
                  name="refundPolicy"
                  label="Legacy Refund Policy text"
                  defaultValue={store?.policies?.refundPolicy}
                  disabled
                />
                <Field
                  name="shippingPolicy"
                  label="Legacy Shipping Policy text"
                  defaultValue={store?.policies?.shippingPolicy}
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field name="storeTitle" label="Store Title" defaultValue={store?.seo?.storeTitle} />
              <Field name="metaTitle" label="Meta Title" defaultValue={store?.seo?.metaTitle} />
              <Field name="metaDescription" label="Meta Description" defaultValue={store?.seo?.metaDescription} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={saveStore.isPending}>
                <Save className="h-4 w-4" />
                Save Store
              </Button>
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="border-amber-400/30 text-amber-300">
                  {field}
                </Badge>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function categoryKey(value?: string) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
