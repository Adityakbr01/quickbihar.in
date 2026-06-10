"use client";

import { type FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManagementGroupSection } from "./ManagementGroupSection";
import { useUpdateAppConfig } from "@/features/dashboard/hooks/useAdminManagement";
import { inputClass, optionalValue, numericValue } from "./utils";
import type { AppConfig, ManagementGroup } from "@/features/dashboard/api/adminManagement.api";

export function StoreConfigurationSection({
  group,
  config,
  isLoading,
}: {
  group?: ManagementGroup;
  config?: AppConfig;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="py-10 text-sm text-gray-400">
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {group && (
        <ManagementGroupSection
          group={group}
          title="Store Configuration"
          isLoading={false}
        />
      )}
      <StoreConfigurationForm
        key={JSON.stringify(config || {})}
        initialConfig={config || {}}
      />
    </div>
  );
}

function StoreConfigurationForm({
  initialConfig,
}: {
  initialConfig: AppConfig;
}) {
  const updateAppConfig = useUpdateAppConfig();
  const [storeName, setStoreName] = useState(
    initialConfig.store?.storeName || "",
  );
  const [appTitle, setAppTitle] = useState(initialConfig.store?.appTitle || "");
  const [metaTitle, setMetaTitle] = useState(
    initialConfig.seo?.metaTitle || "",
  );
  const [metaDescription, setMetaDescription] = useState(
    initialConfig.seo?.metaDescription || "",
  );
  const [keywords, setKeywords] = useState(
    (initialConfig.seo?.keywords || []).join(", "),
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(initialConfig.shipping?.freeShippingThreshold ?? ""),
  );
  const [shippingFee, setShippingFee] = useState(
    String(initialConfig.shipping?.shippingFee ?? ""),
  );
  const [taxEnabled, setTaxEnabled] = useState(
    Boolean(initialConfig.tax?.enabled),
  );
  const [taxRate, setTaxRate] = useState(String(initialConfig.tax?.rate ?? ""));
  const [taxInclusive, setTaxInclusive] = useState(
    initialConfig.tax?.inclusive ?? true,
  );
  const [currencyCode, setCurrencyCode] = useState(
    initialConfig.currency?.code || "INR",
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    initialConfig.currency?.symbol || "Rs.",
  );
  const [defaultRadiusKm, setDefaultRadiusKm] = useState(
    String(initialConfig.delivery?.defaultRadiusKm ?? ""),
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    String(initialConfig.delivery?.minOrderAmount ?? ""),
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String(initialConfig.delivery?.estimatedMinutes ?? ""),
  );
  const [riderPayoutAmount, setRiderPayoutAmount] = useState(
    String(initialConfig.delivery?.riderPayoutAmount ?? ""),
  );
  const [returnPolicy, setReturnPolicy] = useState(
    initialConfig.policies?.returnPolicy || "",
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialConfig.policies?.termsAndConditions || "",
  );
  const [privacyPolicy, setPrivacyPolicy] = useState(
    initialConfig.policies?.privacyPolicy || "",
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateAppConfig.mutate({
      store: {
        storeName: optionalValue(storeName),
        appTitle: optionalValue(appTitle),
      },
      seo: {
        metaTitle: optionalValue(metaTitle),
        metaDescription: optionalValue(metaDescription),
        keywords: keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      shipping: {
        freeShippingThreshold: numericValue(freeShippingThreshold),
        shippingFee: numericValue(shippingFee),
      },
      tax: {
        enabled: taxEnabled,
        rate: numericValue(taxRate),
        inclusive: taxInclusive,
      },
      currency: {
        code: currencyCode.trim().toUpperCase(),
        symbol: currencySymbol.trim(),
      },
      delivery: {
        defaultRadiusKm: numericValue(defaultRadiusKm),
        minOrderAmount: numericValue(minOrderAmount),
        estimatedMinutes: numericValue(estimatedMinutes),
        riderPayoutAmount: numericValue(riderPayoutAmount),
      },
      policies: {
        returnPolicy,
        termsAndConditions,
        privacyPolicy,
      },
    });
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">
          Editable Store Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="Store Name"
              className={inputClass}
            />
            <Input
              value={appTitle}
              onChange={(event) => setAppTitle(event.target.value)}
              placeholder="App Title"
              className={inputClass}
            />
            <Input
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              placeholder="Meta Title"
              className={inputClass}
            />
            <Input
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="Meta Keywords"
              className={inputClass}
            />
            <Input
              value={freeShippingThreshold}
              onChange={(event) => setFreeShippingThreshold(event.target.value)}
              placeholder="Free Shipping Threshold"
              type="number"
              min="0"
              className={inputClass}
            />
            <Input
              value={shippingFee}
              onChange={(event) => setShippingFee(event.target.value)}
              placeholder="Shipping Fee"
              type="number"
              min="0"
              className={inputClass}
            />
            <Input
              value={currencyCode}
              onChange={(event) => setCurrencyCode(event.target.value)}
              placeholder="Currency Code"
              maxLength={3}
              className={inputClass}
            />
            <Input
              value={currencySymbol}
              onChange={(event) => setCurrencySymbol(event.target.value)}
              placeholder="Currency Symbol"
              className={inputClass}
            />
            <Input
              value={defaultRadiusKm}
              onChange={(event) => setDefaultRadiusKm(event.target.value)}
              placeholder="Delivery Radius Km"
              type="number"
              min="0"
              className={inputClass}
            />
            <Input
              value={minOrderAmount}
              onChange={(event) => setMinOrderAmount(event.target.value)}
              placeholder="Minimum Order Amount"
              type="number"
              min="0"
              className={inputClass}
            />
            <Input
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              placeholder="Estimated Delivery Minutes"
              type="number"
              min="1"
              className={inputClass}
            />
            <Input
              value={riderPayoutAmount}
              onChange={(event) => setRiderPayoutAmount(event.target.value)}
              placeholder="Rider Payout Amount"
              type="number"
              min="0"
              className={inputClass}
            />
            <Input
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
              placeholder="Tax Rate %"
              type="number"
              min="0"
              max="100"
              className={inputClass}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(event) => setTaxEnabled(event.target.checked)}
              />
              Tax enabled
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(event) => setTaxInclusive(event.target.checked)}
              />
              Tax inclusive pricing
            </label>
          </div>

          <textarea
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
            placeholder="Meta Description"
            className="min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <textarea
            value={returnPolicy}
            onChange={(event) => setReturnPolicy(event.target.value)}
            placeholder="Return & Refund Policy"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <textarea
            value={termsAndConditions}
            onChange={(event) => setTermsAndConditions(event.target.value)}
            placeholder="Terms & Conditions"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <textarea
            value={privacyPolicy}
            onChange={(event) => setPrivacyPolicy(event.target.value)}
            placeholder="Privacy Policy"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />

          <div>
            <Button type="submit" disabled={updateAppConfig.isPending}>
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
