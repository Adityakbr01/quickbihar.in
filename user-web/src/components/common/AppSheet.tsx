import React from "react";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetOverlay,
  SheetPortal,
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
 * App chrome can sit at extreme z-indexes (BottomTabBar is z-[9999]).
 * A modal sheet must paint above ALL of it, or taps land on the tab
 * bar behind the sheet and the sheet looks cut off. Radix's default
 * z-50 loses that fight, so overlay + content carry explicit z-indexes.
 */
const SHEET_OVERLAY_Z = 10000;
const SHEET_CONTENT_Z = 10001;

/**
 * Shared bottom sheet built on the shadcn `Sheet` (bottom side).
 *
 * Same props API as before, so every call site works unchanged:
 * themed background, rounded top, drag-handle look, title + close
 * button, content-sized body (native auto height, max 92% viewport,
 * inner scroll past that), optional footer.
 *
 * Tap-through safety: Radix closes on outside POINTER-DOWN, and the
 * trailing click then lands on whatever is revealed underneath. We
 * prevent that default and close on backdrop CLICK instead — the click
 * already targeted the overlay, so nothing behind can receive it.
 * Escape key and the close button work as usual.
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only real backdrop taps close — never propagated content clicks.
    // Stop here regardless: the sheet often lives INSIDE a clickable
    // card/row fiber, and React events bubble through the FIBER tree
    // (portals don't isolate them), so an unstopped click would also
    // fire the parent's onClick (e.g. open product detail underneath).
    e.stopPropagation();
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetPortal>
        <SheetOverlay
          onClick={handleBackdropClick}
          className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          style={{ zIndex: SHEET_OVERLAY_Z, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        />
        <SheetPrimitive.Content
          data-slot="sheet-content"
          aria-label={title || subtitle ? undefined : fallbackLabel}
          // Never auto-close on outside pointer-down (tap-through vector:
          // the following click would land on revealed content behind).
          // Backdrop CLICK (above) and Escape still close.
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          // CENTRAL propagation guard (the actual everywhere-bug fix):
          // sheets are frequently rendered INSIDE clickable cards/rows, and
          // React synthetic events bubble through the FIBER tree — portals
          // do NOT isolate them. Without this stop, every tap inside the
          // sheet (X, options, sizes…) also fires the parent's onClick and
          // e.g. opens the product detail page underneath. Stopping here
          // covers all present + future call sites in one place.
          // (Escape is intentionally NOT stopped — radix closes on it.)
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
          className={cn(
            "fixed flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "mx-auto w-full max-w-[512px] gap-0 rounded-t-3xl p-0 max-h-[92dvh]",
          )}
          style={{
            zIndex: SHEET_CONTENT_Z,
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            // vh fallback for browsers without dvh; the class above wins
            // where dvh is supported.
            maxHeight: "92vh",
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

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {children}
          </div>

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
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default AppSheet;
