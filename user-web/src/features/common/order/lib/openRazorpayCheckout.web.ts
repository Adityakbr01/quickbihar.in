declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (eventName: string, callback: (response: any) => void) => void;
    };
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in a browser"));
  }

  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: any): Promise<any> {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({
      ...options,
      handler: resolve,
      modal: {
        ...(options.modal || {}),
        ondismiss: () => reject(new Error("The payment process was interrupted. No money was deducted.")),
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response?.error?.description || "Payment failed"));
    });

    checkout.open();
  });
}
