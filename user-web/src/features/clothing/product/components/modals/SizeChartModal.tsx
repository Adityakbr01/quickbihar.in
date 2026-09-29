import React, { useState } from "react";
import { CircleCheck, PersonStanding, X } from "lucide-react";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChart } from "../../types/product.types";
import * as Haptics from "@/lib/haptics";

interface SizeChartModalProps {
  visible: boolean;
  onClose: () => void;
  sizeChart?: ISizeChart | null;
  selectedSize?: string | null;
  category?: string;
  theme: Theme;
}

const DEFAULT_CHART: ISizeChart = {
  _id: "default-apparel-chart",
  name: "Standard Clothing Size Guide",
  category: "Clothing",
  unit: "inches",
  fields: ["chest", "length", "shoulder", "waist"],
  data: [
    { size: "XS", chest: "36", length: "26", shoulder: "16.5", waist: "30" },
    { size: "S", chest: "38", length: "27", shoulder: "17.0", waist: "32" },
    { size: "M", chest: "40", length: "28", shoulder: "17.5", waist: "34" },
    { size: "L", chest: "42", length: "29", shoulder: "18.5", waist: "36" },
    { size: "XL", chest: "44", length: "30", shoulder: "19.5", waist: "38" },
    { size: "XXL", chest: "46", length: "31", shoulder: "20.5", waist: "40" },
    { size: "3XL", chest: "48", length: "32", shoulder: "21.5", waist: "42" },
  ],
  howToMeasure: [
    "Chest: Measure around the fullest part of your chest, keeping the measuring tape horizontal.",
    "Length: Measure from the highest point of the shoulder down to the bottom hemline.",
    "Shoulder: Measure across the back from one shoulder edge to the other.",
    "Waist: Measure around your natural waistline, where you typically wear your waistband.",
  ],
};

const SizeChartModal = ({
  visible,
  onClose,
  sizeChart,
  selectedSize,
  category,
  theme,
}: SizeChartModalProps) => {
  const [activeUnit, setActiveUnit] = useState<"inches" | "cm">("inches");

  if (!visible) return null;

  const effectiveChart =
    sizeChart && sizeChart.data && sizeChart.data.length > 0
      ? sizeChart
      : DEFAULT_CHART;

  const { fields, data, name, howToMeasure } = effectiveChart;

  const handleUnitToggle = (unit: "inches" | "cm") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveUnit(unit);
  };

  // Convert value if unit is CM and original was inches
  const formatCellValue = (val: string | number | undefined) => {
    if (!val || val === "-") return "-";
    const num = parseFloat(String(val));
    if (isNaN(num)) return String(val);

    if (activeUnit === "cm") {
      return (num * 2.54).toFixed(1);
    }
    return String(num);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={name || "Size & Fit Guide"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between px-4 py-3">
          <div className="flex-1">
            <h3 className="text-base font-bold" style={{ color: theme.text }}>
              {name || "Size & Fit Guide"}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: theme.secondaryText }}>
              Find your perfect fit ({category || "Apparel"})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
            style={{ backgroundColor: theme.secondaryBackground }}
          >
            <X size={18} color={theme.text} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* Unit Toggle Buttons */}
          <div className="mb-4 flex justify-center">
            <div
              className="flex flex-row items-center self-center rounded-lg border p-0.5"
              style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
            >
              {(["inches", "cm"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleUnitToggle(unit)}
                  className="cursor-pointer rounded-md px-4.5 py-1.5 text-xs font-bold"
                  style={activeUnit === unit ? { backgroundColor: theme.primary, color: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" } : { color: theme.secondaryText }}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
            {/* Table Header */}
            <div className="flex flex-row py-3" style={{ backgroundColor: theme.tertiaryBackground }}>
              <div className="flex flex-[0.9] items-center justify-center border-r border-black/10 px-1.5 py-2.5">
                <span className="text-[11px] font-extrabold tracking-wide" style={{ color: theme.text }}>
                  SIZE
                </span>
              </div>
              {fields.map((field) => (
                <div key={field} className="flex flex-1 items-center justify-center px-1.5 py-2.5">
                  <span className="text-[11px] font-extrabold tracking-wide" style={{ color: theme.text }}>
                    {String(field || "").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {data.map((row, index) => {
              const rowSizeStr = String(
                row?.size ??
                  row?.Size ??
                  row?.["Size (UK)"] ??
                  row?.["Size (Age)"] ??
                  Object.values(row || {})[0] ??
                  "",
              );
              const isSelected = Boolean(
                selectedSize &&
                  rowSizeStr &&
                  rowSizeStr.toUpperCase() ===
                    String(selectedSize).toUpperCase(),
              );
              return (
                <div
                  key={index}
                  className="flex flex-row border-t"
                  style={{
                    borderTopColor: theme.border,
                    backgroundColor: isSelected
                      ? theme.primary + "1A"
                      : index % 2 === 1
                        ? theme.tertiaryBackground + "40"
                        : undefined,
                  }}
                >
                  <div className="flex flex-[0.9] items-center justify-center border-r border-black/10 px-1.5 py-2.5">
                    <span className="flex flex-row items-center gap-1 text-[13px]" style={{ color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? 800 : 700 }}>
                      {rowSizeStr || "-"}
                      {isSelected && <CircleCheck size={13} color={theme.primary} />}
                    </span>
                  </div>
                  {fields.map((field) => (
                    <div key={field} className="flex flex-1 items-center justify-center px-1.5 py-2.5">
                      <span
                        className="text-[13px]"
                        style={{
                          color: isSelected ? theme.primary : theme.secondaryText,
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {formatCellValue(row[field])}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* How to Measure Section */}
          {howToMeasure && howToMeasure.length > 0 && (
            <div
              className="mt-5 flex flex-col gap-2 rounded-xl border p-4"
              style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
            >
              <div className="mb-1 flex flex-row items-center gap-2">
                <PersonStanding size={18} color={theme.primary} />
                <h4 className="text-sm font-bold" style={{ color: theme.text }}>
                  How to Measure Correctly
                </h4>
              </div>
              {howToMeasure.map((step, i) => (
                <div key={i} className="mb-1 flex flex-row items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <p className="flex-1 text-xs leading-[18px]" style={{ color: theme.secondaryText }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
