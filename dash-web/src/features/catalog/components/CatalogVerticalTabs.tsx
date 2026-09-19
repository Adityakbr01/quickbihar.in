import { CATALOG_VERTICALS, type CatalogVertical } from "../lib/catalogVerticals";
import { cn } from "@/lib/utils";

interface CatalogVerticalTabsProps {
  value: CatalogVertical;
  onChange: (next: CatalogVertical) => void;
  /** Lock tabs when editing (vertical is fixed after creation). */
  disabled?: boolean;
}

/**
 * Catalog picker for product forms — one tab per vertical.
 * Shared by the admin + seller dialogs so both stay in sync.
 */
export function CatalogVerticalTabs({ value, onChange, disabled }: CatalogVerticalTabsProps) {
  return (
    <div>
      <div
        role="tablist"
        aria-label="Product catalog"
        className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1"
      >
        {CATALOG_VERTICALS.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(tab.value)}
              title={tab.hint}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                disabled && !active && "cursor-not-allowed opacity-50",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {disabled && (
        <p className="mt-1 text-xs text-muted-foreground">
          Catalog is fixed for existing products.
        </p>
      )}
    </div>
  );
}
