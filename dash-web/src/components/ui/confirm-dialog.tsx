import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TriangleAlert, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  /** Dialog heading, e.g. "Delete product?" */
  title: string;
  /** Supporting text. String or JSX. */
  description?: ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Button tone. `destructive` (default) for irreversible/dangerous
   * actions, `primary` for safe-but-significant ones (e.g. approvals).
   */
  tone?: "destructive" | "primary";
}

type PendingRequest = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Ask the user to confirm an important action.
 *
 * ```tsx
 * const confirm = useConfirm();
 * const ok = await confirm({
 *   title: "Delete product?",
 *   description: "This permanently removes the product from your store.",
 *   confirmLabel: "Delete",
 * });
 * if (!ok) return;
 * deleteProduct(id);
 * ```
 *
 * Resolves `false` on cancel, backdrop click, or Escape.
 * Requires <ConfirmProvider> above (mounted once in main.tsx).
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  // Guards against double-resolve (e.g. confirm click + close event).
  const settledRef = useRef(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      settledRef.current = false;
      setRequest({ options, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setRequest((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const tone = request?.options.tone ?? "destructive";
  const DestructiveIcon = tone === "destructive" ? TriangleAlert : Info;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={request !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span
                className={
                  tone === "destructive"
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                }
              >
                <DestructiveIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-left text-lg font-bold">
                  {request?.options.title}
                </DialogTitle>
                {request?.options.description ? (
                  <DialogDescription className="mt-1.5 text-left">
                    {request.options.description}
                  </DialogDescription>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {request?.options.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              onClick={() => settle(true)}
              className={
                tone === "destructive"
                  ? "bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                  : "font-semibold"
              }
            >
              {request?.options.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
