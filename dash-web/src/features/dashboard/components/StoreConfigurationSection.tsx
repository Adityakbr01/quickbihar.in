"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManagementGroupSection } from "./ManagementGroupSection";
import { useUpdateAppConfig } from "@/features/dashboard/hooks/useAdminManagement";
import { inputClass, optionalValue, numericValue, selectClass } from "./utils";
import type { AppConfig, ManagementGroup } from "@/features/dashboard/api/adminManagement.api";

const configLabelClass = "grid gap-1 text-xs font-medium text-gray-300";
const configHelperClass = "text-[11px] font-normal leading-4 text-gray-500";
const configTextareaClass =
  "min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";

function ConfigField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className={configLabelClass}>
      <span>{label}</span>
      {children}
      {helper ? <span className={configHelperClass}>{helper}</span> : null}
    </label>
  );
}

function ConfigSection({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

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
  const [commissionPercent, setCommissionPercent] = useState(
    String(initialConfig.marketplace?.commissionPercent ?? ""),
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
  const [riderPayoutUpto3Km, setRiderPayoutUpto3Km] = useState(
    String(initialConfig.delivery?.riderPayoutRules?.upto3Km ?? ""),
  );
  const [riderPayoutUpto5Km, setRiderPayoutUpto5Km] = useState(
    String(initialConfig.delivery?.riderPayoutRules?.upto5Km ?? ""),
  );
  const [riderPayoutUpto8Km, setRiderPayoutUpto8Km] = useState(
    String(initialConfig.delivery?.riderPayoutRules?.upto8Km ?? ""),
  );
  const [riderPayoutExtraPerKm, setRiderPayoutExtraPerKm] = useState(
    String(initialConfig.delivery?.riderPayoutRules?.extraPerKmAfter8 ?? ""),
  );
  const [riderRainBonus, setRiderRainBonus] = useState(
    String(initialConfig.delivery?.bonusRules?.rainBonus ?? initialConfig.delivery?.riderPayoutRules?.rainBonus ?? ""),
  );
  const [riderPeakBonus, setRiderPeakBonus] = useState(
    String(initialConfig.delivery?.bonusRules?.peakBonus ?? initialConfig.delivery?.riderPayoutRules?.peakBonus ?? ""),
  );
  const [riderFestivalBonus, setRiderFestivalBonus] = useState(
    String(initialConfig.delivery?.bonusRules?.festivalBonus ?? initialConfig.delivery?.riderPayoutRules?.festivalBonus ?? ""),
  );
  const [riderNightBonus, setRiderNightBonus] = useState(
    String(initialConfig.delivery?.bonusRules?.nightBonus ?? initialConfig.delivery?.riderPayoutRules?.nightBonus ?? ""),
  );
  const [rainMode, setRainMode] = useState(initialConfig.delivery?.bonusRules?.rainMode || "AUTO");
  const [peakMode, setPeakMode] = useState(initialConfig.delivery?.bonusRules?.peakMode || "AUTO");
  const [festivalMode, setFestivalMode] = useState(initialConfig.delivery?.bonusRules?.festivalMode || "AUTO");
  const [nightMode, setNightMode] = useState(initialConfig.delivery?.bonusRules?.nightMode || "AUTO");
  const firstPeakWindow = initialConfig.delivery?.bonusRules?.peakWindows?.[0];
  const firstFestivalWindow = initialConfig.delivery?.bonusRules?.festivalWindows?.[0];
  const [peakStart, setPeakStart] = useState(firstPeakWindow?.start || "18:00");
  const [peakEnd, setPeakEnd] = useState(firstPeakWindow?.end || "21:00");
  const [festivalName, setFestivalName] = useState(firstFestivalWindow?.name || "");
  const [festivalStart, setFestivalStart] = useState(firstFestivalWindow?.startDate || "");
  const [festivalEnd, setFestivalEnd] = useState(firstFestivalWindow?.endDate || "");
  const [nightStart, setNightStart] = useState(initialConfig.delivery?.bonusRules?.nightStart || "22:00");
  const [nightEnd, setNightEnd] = useState(initialConfig.delivery?.bonusRules?.nightEnd || "06:00");
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
      marketplace: {
        commissionPercent: numericValue(commissionPercent),
      },
      delivery: {
        defaultRadiusKm: numericValue(defaultRadiusKm),
        minOrderAmount: numericValue(minOrderAmount),
        estimatedMinutes: numericValue(estimatedMinutes),
        riderPayoutAmount: numericValue(riderPayoutAmount),
        riderPayoutRules: {
          upto3Km: numericValue(riderPayoutUpto3Km),
          upto5Km: numericValue(riderPayoutUpto5Km),
          upto8Km: numericValue(riderPayoutUpto8Km),
          extraPerKmAfter8: numericValue(riderPayoutExtraPerKm),
          rainBonus: numericValue(riderRainBonus),
          peakBonus: numericValue(riderPeakBonus),
          festivalBonus: numericValue(riderFestivalBonus),
          nightBonus: numericValue(riderNightBonus),
        },
        bonusRules: {
          rainBonus: numericValue(riderRainBonus),
          peakBonus: numericValue(riderPeakBonus),
          festivalBonus: numericValue(riderFestivalBonus),
          nightBonus: numericValue(riderNightBonus),
          rainMode: rainMode as "AUTO" | "FORCE_ON" | "FORCE_OFF",
          peakMode: peakMode as "AUTO" | "FORCE_ON" | "FORCE_OFF",
          festivalMode: festivalMode as "AUTO" | "FORCE_ON" | "FORCE_OFF",
          nightMode: nightMode as "AUTO" | "FORCE_ON" | "FORCE_OFF",
          peakWindows: peakStart && peakEnd ? [{ start: peakStart, end: peakEnd }] : [],
          festivalWindows: festivalStart && festivalEnd ? [{
            name: optionalValue(festivalName),
            startDate: festivalStart,
            endDate: festivalEnd,
          }] : [],
          nightStart,
          nightEnd,
        },
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
          <ConfigSection
            title="Store Identity"
            helper="These labels are shown across the app, browser title, and public store metadata."
          >
            <ConfigField label="Store Name" helper="Customer-facing marketplace/store name.">
              <Input
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="QuickBihar Fashion"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="App Title" helper="Short app title used in dashboard and metadata.">
              <Input
                value={appTitle}
                onChange={(event) => setAppTitle(event.target.value)}
                placeholder="QuickBihar"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Meta Title" helper="SEO title for public pages.">
              <Input
                value={metaTitle}
                onChange={(event) => setMetaTitle(event.target.value)}
                placeholder="Quick Bihar"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Meta Keywords" helper="Comma-separated SEO keywords.">
              <Input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="shopping, ecommerce, bihar"
                className={inputClass}
              />
            </ConfigField>
          </ConfigSection>

          <ConfigSection
            title="Checkout Pricing"
            helper="These values decide what the customer sees before payment and what the seller earns."
          >
            <ConfigField label="Free Shipping Threshold" helper="Cart subtotal at or above this amount gets zero delivery fee.">
              <Input
                value={freeShippingThreshold}
                onChange={(event) => setFreeShippingThreshold(event.target.value)}
                placeholder="2000"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Customer Shipping Fee" helper="Visible delivery fee charged when free-shipping threshold is not met.">
              <Input
                value={shippingFee}
                onChange={(event) => setShippingFee(event.target.value)}
                placeholder="99"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Marketplace Commission %" helper="Percentage deducted from seller item amount after seller coupon share.">
              <Input
                value={commissionPercent}
                onChange={(event) => setCommissionPercent(event.target.value)}
                placeholder="15"
                type="number"
                min="0"
                max="100"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Minimum Delivery Order Amount" helper="Optional minimum order amount for delivery eligibility.">
              <Input
                value={minOrderAmount}
                onChange={(event) => setMinOrderAmount(event.target.value)}
                placeholder="0"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Currency Code" helper="Three-letter ISO currency code.">
              <Input
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                placeholder="INR"
                maxLength={3}
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Currency Symbol" helper="Use Rs. to avoid encoding issues in mobile UI.">
              <Input
                value={currencySymbol}
                onChange={(event) => setCurrencySymbol(event.target.value)}
                placeholder="Rs."
                className={inputClass}
              />
            </ConfigField>
          </ConfigSection>

          <ConfigSection
            title="Delivery Defaults"
            helper="General delivery settings used by checkout estimates and fallback rider assignment."
          >
            <ConfigField label="Delivery Radius Km" helper="Default service radius for delivery operations.">
              <Input
                value={defaultRadiusKm}
                onChange={(event) => setDefaultRadiusKm(event.target.value)}
                placeholder="5"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Estimated Delivery Minutes" helper="Customer-facing delivery ETA fallback.">
              <Input
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                placeholder="45"
                type="number"
                min="1"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Legacy Rider Payout Fallback" helper="Used only for older order paths without distance slab snapshot.">
              <Input
                value={riderPayoutAmount}
                onChange={(event) => setRiderPayoutAmount(event.target.value)}
                placeholder="40"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
          </ConfigSection>

          <ConfigSection
            title="Rider Base Payout Slabs"
            helper="Rider base payout is calculated by store-to-customer distance and locked into the order quote."
          >
            <ConfigField label="Payout Up To 3 Km" helper="Example: Rs. 20 for nearby orders.">
              <Input
                value={riderPayoutUpto3Km}
                onChange={(event) => setRiderPayoutUpto3Km(event.target.value)}
                placeholder="20"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Payout Up To 5 Km" helper="Example: Rs. 30 for medium-near orders.">
              <Input
                value={riderPayoutUpto5Km}
                onChange={(event) => setRiderPayoutUpto5Km(event.target.value)}
                placeholder="30"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Payout Up To 8 Km" helper="Example: Rs. 45 for longer local orders.">
              <Input
                value={riderPayoutUpto8Km}
                onChange={(event) => setRiderPayoutUpto8Km(event.target.value)}
                placeholder="45"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Extra Per Km After 8 Km" helper="Added per extra rounded-up km after 8 km.">
              <Input
                value={riderPayoutExtraPerKm}
                onChange={(event) => setRiderPayoutExtraPerKm(event.target.value)}
                placeholder="5"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
          </ConfigSection>

          <ConfigSection
            title="Dynamic Rider Bonuses"
            helper="These bonuses become visible dynamic delivery surcharge in checkout when active."
          >
            <ConfigField label="Rain Bonus Amount" helper="Paid to rider when rain mode is active.">
              <Input
                value={riderRainBonus}
                onChange={(event) => setRiderRainBonus(event.target.value)}
                placeholder="12"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Rain Bonus Mode" helper="Auto uses Open-Meteo; force options override weather.">
              <select value={rainMode} onChange={(event) => setRainMode(event.target.value as "AUTO" | "FORCE_ON" | "FORCE_OFF")} className={selectClass}>
                <option value="AUTO">Auto weather</option>
                <option value="FORCE_ON">Force on</option>
                <option value="FORCE_OFF">Force off</option>
              </select>
            </ConfigField>
            <ConfigField label="Peak Bonus Amount" helper="Paid during configured peak time window.">
              <Input
                value={riderPeakBonus}
                onChange={(event) => setRiderPeakBonus(event.target.value)}
                placeholder="10"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Peak Bonus Mode" helper="Auto follows the peak start/end time below.">
              <select value={peakMode} onChange={(event) => setPeakMode(event.target.value as "AUTO" | "FORCE_ON" | "FORCE_OFF")} className={selectClass}>
                <option value="AUTO">Auto window</option>
                <option value="FORCE_ON">Force on</option>
                <option value="FORCE_OFF">Force off</option>
              </select>
            </ConfigField>
            <ConfigField label="Peak Start Time" helper="Start time in local India time.">
              <Input
                value={peakStart}
                onChange={(event) => setPeakStart(event.target.value)}
                type="time"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Peak End Time" helper="End time in local India time.">
              <Input
                value={peakEnd}
                onChange={(event) => setPeakEnd(event.target.value)}
                type="time"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Festival Bonus Amount" helper="Paid during configured festival date range.">
              <Input
                value={riderFestivalBonus}
                onChange={(event) => setRiderFestivalBonus(event.target.value)}
                placeholder="15"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Festival Bonus Mode" helper="Auto follows festival start/end dates below.">
              <select value={festivalMode} onChange={(event) => setFestivalMode(event.target.value as "AUTO" | "FORCE_ON" | "FORCE_OFF")} className={selectClass}>
                <option value="AUTO">Auto date range</option>
                <option value="FORCE_ON">Force on</option>
                <option value="FORCE_OFF">Force off</option>
              </select>
            </ConfigField>
            <ConfigField label="Festival Name" helper="Optional label for admin reference.">
              <Input
                value={festivalName}
                onChange={(event) => setFestivalName(event.target.value)}
                placeholder="Diwali"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Festival Start Date" helper="First date when festival bonus can apply.">
              <Input
                value={festivalStart}
                onChange={(event) => setFestivalStart(event.target.value)}
                type="date"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Festival End Date" helper="Last date when festival bonus can apply.">
              <Input
                value={festivalEnd}
                onChange={(event) => setFestivalEnd(event.target.value)}
                type="date"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Night Bonus Amount" helper="Paid during configured night time window.">
              <Input
                value={riderNightBonus}
                onChange={(event) => setRiderNightBonus(event.target.value)}
                placeholder="8"
                type="number"
                min="0"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Night Bonus Mode" helper="Auto follows the night start/end time below.">
              <select value={nightMode} onChange={(event) => setNightMode(event.target.value as "AUTO" | "FORCE_ON" | "FORCE_OFF")} className={selectClass}>
                <option value="AUTO">Auto window</option>
                <option value="FORCE_ON">Force on</option>
                <option value="FORCE_OFF">Force off</option>
              </select>
            </ConfigField>
            <ConfigField label="Night Start Time" helper="Supports overnight windows such as 22:00 to 06:00.">
              <Input
                value={nightStart}
                onChange={(event) => setNightStart(event.target.value)}
                type="time"
                className={inputClass}
              />
            </ConfigField>
            <ConfigField label="Night End Time" helper="Supports overnight windows such as 22:00 to 06:00.">
              <Input
                value={nightEnd}
                onChange={(event) => setNightEnd(event.target.value)}
                type="time"
                className={inputClass}
              />
            </ConfigField>
          </ConfigSection>

          <ConfigSection title="Tax Settings" helper="Tax values are used for item price and bill display.">
            <ConfigField label="Tax Rate %" helper="GST/tax percentage used when tax is enabled.">
              <Input
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
                placeholder="0"
                type="number"
                min="0"
                max="100"
                className={inputClass}
              />
            </ConfigField>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(event) => setTaxEnabled(event.target.checked)}
              />
              Tax enabled
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(event) => setTaxInclusive(event.target.checked)}
              />
              Tax inclusive pricing
            </label>
          </ConfigSection>

          <ConfigSection title="SEO And Policies" helper="Long-form policy text shown to users and sellers.">
            <ConfigField label="Meta Description" helper="Short SEO description for public pages.">
              <textarea
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                placeholder="The best shopping experience in Bihar."
                className={configTextareaClass}
              />
            </ConfigField>
            <ConfigField label="Return And Refund Policy" helper="Default policy copy shown in marketplace support surfaces.">
              <textarea
                value={returnPolicy}
                onChange={(event) => setReturnPolicy(event.target.value)}
                placeholder="7 days easy return policy"
                className={configTextareaClass}
              />
            </ConfigField>
            <ConfigField label="Terms And Conditions" helper="Default terms for customer and seller-facing pages.">
              <textarea
                value={termsAndConditions}
                onChange={(event) => setTermsAndConditions(event.target.value)}
                placeholder="Terms and conditions"
                className={configTextareaClass}
              />
            </ConfigField>
            <ConfigField label="Privacy Policy" helper="Privacy policy text used by the app/site.">
              <textarea
                value={privacyPolicy}
                onChange={(event) => setPrivacyPolicy(event.target.value)}
                placeholder="Privacy policy"
                className={configTextareaClass}
              />
            </ConfigField>
          </ConfigSection>

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
