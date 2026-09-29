import React from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

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
 * Shared bottom sheet built on the lightweight `react-modal-sheet`
 * package (spring physics, drag-to-dismiss, snap points, backdrop).
 *
 * One place for the sheet chrome every dialog in the app uses:
 * themed background, rounded top, drag handle, title + close button,
 * scrollable body, optional footer.
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

  return (
    <Sheet
      isOpen={visible}
      onClose={onClose}
      detent="content"
      aria-label={typeof label === "string" ? label : undefined}
    >
      <Sheet.Container
        style={{
          backgroundColor: theme.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxWidth: 512,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Sheet.Header style={{ paddingTop: 8, cursor: "grab" }}>
          <Sheet.DragIndicator
            style={{ backgroundColor: theme.border, width: 40, height: 4, borderRadius: 2 }}
          />
        </Sheet.Header>

        <Sheet.Content style={{ paddingBottom: footer ? 0 : 16 }}>
          {(title || subtitle) && (
            <div className="flex flex-row items-start justify-between gap-3 px-4 pt-1 pb-2">
              <div className="min-w-0 flex-1">
                {typeof title === "string" ? (
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle ? (
                  <p className="mt-0.5 truncate text-xs" style={{ color: theme.secondaryText }}>
                    {subtitle}
                  </p>
                ) : null}
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
          )}
          {!title && !subtitle && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <X size={18} color={theme.text} />
            </button>
          )}

          <div className="min-h-0 overflow-y-auto">{children}</div>

          {footer ? (
            <div
              className="border-t px-4 py-3"
              style={{ borderTopColor: theme.border, backgroundColor: theme.background }}
            >
              {footer}
            </div>
          ) : null}
        </Sheet.Content>
      </Sheet.Container>

      <Sheet.Backdrop
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      />
    </Sheet>
  );
};

export default AppSheet;
