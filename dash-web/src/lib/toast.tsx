import { type ReactElement, type ReactNode } from "react";
import hotToast, { type Renderable, type ToastOptions } from "react-hot-toast";
import { Info } from "lucide-react";

/**
 * App-wide feedback toasts (react-hot-toast).
 *
 * Single reusable API for every edit / change / update / delete / login /
 * logout confirmation across admin, seller, and delivery portals. Call
 * signatures mirror the previous system so all existing call sites work
 * unchanged:
 *
 *   toast.success("Product saved");
 *   toast.error("Could not delete banner");
 *   toast.info("New order received", { description: "…" , duration: 5000 });
 *
 * Styling comes from the shared index.css theme tokens (via CSS vars on the
 * Toaster in main.tsx), so toasts follow light/dark automatically.
 */

export type FeedbackOptions = {
  /** Secondary line rendered under the message. */
  description?: ReactNode;
  /** Auto-dismiss delay in ms. */
  duration?: number;
  /** Toast id for deduping / programmatic dismissal. */
  id?: string;
};

function body(message: Renderable, description?: ReactNode): Renderable {
  if (description === undefined || description === null || description === "") {
    return message;
  }
  return (
    <div className="grid gap-0.5 text-left">
      <div className="text-sm font-semibold">{message}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  );
}

function options(opts?: FeedbackOptions): ToastOptions {
  if (!opts) return {};
  const { duration, id } = opts;
  return {
    ...(duration !== undefined ? { duration } : {}),
    ...(id !== undefined ? { id } : {}),
  };
}

export const toast = {
  success: (message: Renderable, opts?: FeedbackOptions) =>
    hotToast.success(body(message, opts?.description), options(opts)),
  error: (message: Renderable, opts?: FeedbackOptions) =>
    hotToast.error(body(message, opts?.description), options(opts)),
  info: (message: Renderable, opts?: FeedbackOptions) =>
    hotToast(body(message, opts?.description), {
      icon: <Info className="h-4 w-4 shrink-0" />,
      ...options(opts),
    }),
  loading: (message: Renderable, opts?: FeedbackOptions) =>
    hotToast.loading(body(message, opts?.description), options(opts)),
  dismiss: (id?: string) => hotToast.dismiss(id),
};

export default toast;
