import { ENV } from "@/config/env.config";
import { ApiError } from "@/utils/ApiError";

/**
 * Normalize phone to international format expected by MSG91.
 * 10-digit Indian numbers → "91XXXXXXXXXX"
 * Already-prefixed numbers passthrough.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Send a WhatsApp OTP via MSG91.
 * Mirrors the payload from scripts/msg91.js (tested working).
 *
 * Throws user-optimized ApiError and logs technical details to server console.
 */
export async function sendWhatsAppOtp(phone: string, code: string): Promise<void> {
  const authKey = ENV.MSG91_AUTH_KEY;
  const integratedNumber = ENV.MSG91_WHATSAPP_NUMBER;
  const templateName = ENV.MSG91_WHATSAPP_TEMPLATE;

  if (!authKey || !integratedNumber || !templateName) {
    const techMsg = "MSG91 configuration missing. Set MSG91_AUTH_KEY, MSG91_WHATSAPP_NUMBER, MSG91_WHATSAPP_TEMPLATE in .env.";
    const userMsg = "WhatsApp verification service is currently unavailable. Please try again later or contact support.";
    console.error(`[MSG91 Config Error] Technical: ${techMsg} | User Message: ${userMsg}`);
    throw new ApiError(500, userMsg);
  }

  const recipient = normalizePhone(phone);

  const payload = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US", policy: "deterministic" },
        namespace: null,
        to_and_components: [
          {
            to: [recipient],
            components: {
              body_1: { type: "text", value: code },
              button_1: { subtype: "url", type: "text", value: code },
            },
          },
        ],
      },
    },
  };

  try {
    const res = await fetch(
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", authkey: authKey },
        body: JSON.stringify(payload),
      }
    );

    interface Msg91Response {
      apiError?: string;
      message?: string;
      status?: string;
      type?: string;
    }

    const data = (await res.json().catch(() => null)) as Msg91Response | null;

    if (!res.ok || data?.apiError || data?.type === "error") {
      const techMsg = `MSG91 API error: HTTP ${res.status} (${res.statusText}) - Response: ${JSON.stringify(data ?? {})}`;
      const userMsg = "Unable to send verification code on WhatsApp. Please check your phone number and ensure WhatsApp is active.";
      console.error(`[MSG91 API Error] Technical: ${techMsg} | User Message: ${userMsg}`);
      throw new ApiError(502, userMsg);
    }
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const techMsg = `MSG91 network/fetch failure: ${err?.message || err}`;
    const userMsg = "Unable to connect to WhatsApp verification service. Please try again shortly.";
    console.error(`[MSG91 Network Error] Technical: ${techMsg} | User Message: ${userMsg}`, err);
    throw new ApiError(503, userMsg);
  }
}

