import axios from "axios";
import { ENV } from "@/config/env.config";
import type { ISmsProvider, ISmsResult } from "./types";

/**
 * SMSLocal API Error Code Description Map
 */
const SMSLOCAL_ERROR_MAP: Record<string, string> = {
  "101": "Invalid API Key or User Account",
  "102": "Invalid Sender ID",
  "103": "Invalid Contact Number Format",
  "104": "Invalid Route (OTP requires Route 2)",
  "105": "Invalid Message Content",
  "106": "Spam Content Blocked",
  "107": "Promotional Route Block",
  "108": "Low Credits Balance in OTP Route",
  "109": "Promotional Route Timing Restriction",
  "110": "Invalid DLT Template ID",
  "111": "No SMSC Connection Available",
};

/**
 * SMSLocal Provider Adapter
 * Implements SMS delivery via SMSLocal HTTP API (https://app.smslocal.in/api/smsapi).
 */
export class SmsLocalProvider implements ISmsProvider {
  readonly name = "smslocal";

  private readonly baseUrl = "https://app.smslocal.in/api/smsapi";
  private readonly statusUrl = "https://app.smslocal.in/api/dlrapi";
  private readonly creditUrl = "https://app.smslocal.in/api/creditapi";

  /**
   * Sanitizes mobile number to clean 10-digit Indian format.
   * Removes '+91', leading zeros, spaces, and dashes.
   */
  private formatPhoneNumber(rawPhone: string): string {
    const cleaned = (rawPhone || "").replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    return cleaned;
  }

  /**
   * Sends 6-digit OTP code to the target mobile number via SMSLocal OTP Route (route=2).
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<ISmsResult> {
    const apiKey = ENV.SMSLOCAL_API_KEY;
    const senderId = ENV.SMSLOCAL_SENDER_ID;
    const templateId = ENV.SMSLOCAL_TEMPLATE_ID;
    const route = ENV.SMSLOCAL_ROUTE || "2";

    // 1. Check if required SMSLocal credentials exist in environment
    if (!apiKey) {
      console.warn("⚠️ [SMSLocalProvider] SMSLOCAL_API_KEY is not set in environment.");
      return {
        success: false,
        errorCode: "MISSING_API_KEY",
        errorMessage: "SMSLOCAL_API_KEY is missing from server environment configuration.",
      };
    }

    if (!senderId) {
      console.warn("⚠️ [SMSLocalProvider] SMSLOCAL_SENDER_ID is not set in environment.");
      return {
        success: false,
        errorCode: "MISSING_SENDER_ID",
        errorMessage: "SMSLOCAL_SENDER_ID is missing from server environment configuration.",
      };
    }

    if (!templateId) {
      console.warn("⚠️ [SMSLocalProvider] SMSLOCAL_TEMPLATE_ID is not set in environment.");
      return {
        success: false,
        errorCode: "MISSING_TEMPLATE_ID",
        errorMessage: "SMSLOCAL_TEMPLATE_ID is missing from server environment configuration.",
      };
    }

    const cleanPhone = this.formatPhoneNumber(phoneNumber);
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        errorCode: "INVALID_PHONE",
        errorMessage: `Phone number '${phoneNumber}' is not a valid 10-digit Indian mobile number.`,
      };
    }

    // 2. Formulate SMS message body according to approved DLT template
    const messageText = `Your QuickBihar verification code is ${otp}. Valid for 10 minutes. Please do not share this OTP with anyone.`;

    try {
      console.log(`📱 [SMSLocalProvider] Dispatching OTP SMS to mobile: *****${cleanPhone.slice(-4)} | Route: ${route}`);

      // 3. Make HTTP GET request to SMSLocal API with URL query parameter encoding
      const response = await axios.get(this.baseUrl, {
        params: {
          key: apiKey,
          sender: senderId,
          number: cleanPhone,
          route: route, // Must be 2 for OTP
          sms: messageText,
          templateid: templateId,
        },
        timeout: 10000, // 10s timeout
      });

      const responseData = response.data;
      const responseStr = typeof responseData === "string" ? responseData : JSON.stringify(responseData);

      console.log(`📱 [SMSLocalProvider] API Response received from SMSLocal.`);

      // 4. Inspect response for success or error codes
      // SMSLocal returns error response or message ID
      if (typeof responseData === "object" && responseData?.status === "error") {
        const code = String(responseData.code || responseData.error || "");
        const mappedError = SMSLOCAL_ERROR_MAP[code] || responseData.message || responseStr;
        console.error(`❌ [SMSLocalProvider] SMS Error ${code}: ${mappedError}`);
        return {
          success: false,
          errorCode: code || "PROVIDER_ERROR",
          errorMessage: mappedError,
          rawResponse: responseData,
        };
      }

      // Check for numeric error code strings in text responses (e.g. "101", "108", "110")
      const trimmedText = String(responseData).trim();
      if (SMSLOCAL_ERROR_MAP[trimmedText]) {
        const mappedError = SMSLOCAL_ERROR_MAP[trimmedText];
        console.error(`❌ [SMSLocalProvider] SMS Error ${trimmedText}: ${mappedError}`);
        return {
          success: false,
          errorCode: trimmedText,
          errorMessage: mappedError,
          rawResponse: responseData,
        };
      }

      // Success: Extract message ID or transaction reference
      return {
        success: true,
        messageId: trimmedText || "SENT_SUCCESS",
        rawResponse: responseData,
      };
    } catch (error: any) {
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "HTTP Network Error";
      console.error(`❌ [SMSLocalProvider] HTTP Request Failed: ${errorMsg}`);
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: `Failed to connect to SMSLocal API: ${errorMsg}`,
      };
    }
  }

  /**
   * Diagnostic: Checks remaining OTP credit balance on SMSLocal.
   */
  async getCredits(): Promise<any> {
    const apiKey = ENV.SMSLOCAL_API_KEY;
    if (!apiKey) return { error: "SMSLOCAL_API_KEY is not configured." };

    try {
      const response = await axios.get(this.creditUrl, {
        params: {
          key: apiKey,
          route: ENV.SMSLOCAL_ROUTE || "2",
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      return { error: error?.message || "Failed to fetch credit balance" };
    }
  }

  /**
   * Diagnostic: Checks delivery status of a sent message ID.
   */
  async getDeliveryStatus(messageId: string): Promise<any> {
    const apiKey = ENV.SMSLOCAL_API_KEY;
    if (!apiKey) return { error: "SMSLOCAL_API_KEY is not configured." };

    try {
      const response = await axios.get(this.statusUrl, {
        params: {
          key: apiKey,
          messageid: messageId,
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      return { error: error?.message || "Failed to fetch delivery status" };
    }
  }
}
