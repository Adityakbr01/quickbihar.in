import React from "react";
import { X } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/src/components/ui/sheet";

export interface AppSheetProps {
  /** Show/hide the sheet (same `visible` prop every dialog already uses). */
  visible: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Scrollable body content. */
  children: React.ReactNode;
  /** Fixed footer (action buttons). Rendered below the scroll area. */
  footer?: React.ReactNode;
  /** Accessibility label when no title is given. */
  label?: string;
}

/**
 * Shared bottom sheet built on the shadcn `Sheet` (bottom side).
 *
 * Same props API as before, so every call site works unchanged:
 * themed background, rounded top, drag-handle look, title + close
 * button, scrollable body, optional footer. Closes on backdrop
 * click, close button, or Escape.
 */
export const AppSheet: React.FC<AppSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  label,
}) => {
  const theme = useTheme() as any;
  const fallbackLabel = typeof label === "string" && label ? label : "Sheet";

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-label={title || subtitle ? undefined : fallbackLabel}
        className="mx-auto w-full max-w-[512px] gap-0 rounded-t-3xl border-t p-0"
        style={{
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          maxHeight: "92dvh",
        }}
      >
        {/* Drag-handle look (visual anchor, matches previous sheet). */}
        <div className="flex shrink-0 justify-center pt-2" aria-hidden="true">
          <span
            style={{
              backgroundColor: theme.border,
              width: 40,
              height: 4,
              borderRadius: 2,
            }}
          />
        </div>

        {title || subtitle ? (
          <div className="flex shrink-0 flex-row items-start justify-between gap-3 px-4 pt-1 pb-2">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <SheetTitle
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.text,
                    margin: 0,
                  }}
                >
                  {title}
                </SheetTitle>
              ) : (
                title
              )}
              {typeof subtitle === "string" ? (
                subtitle ? (
                  <SheetDescription
                    className="mt-0.5 truncate text-xs"
                    style={{ color: theme.secondaryText }}
                  >
                    {subtitle}
                  </SheetDescription>
                ) : null
              ) : (
                subtitle
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <X size={18} color={theme.text} />
            </button>
          </div>
        ) : (
          <>
            <SheetTitle className="sr-only">{fallbackLabel}</SheetTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <X size={18} color={theme.text} />
            </button>
          </>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <div
            className="shrink-0 border-t px-4 py-3"
            style={{
              borderTopColor: theme.border,
              backgroundColor: theme.background,
            }}
          >
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppSheet;
