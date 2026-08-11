import { ENV } from "@/config/env.config";
import type { ISmsProvider, ISmsResult } from "./types";
import { SmsLocalProvider } from "./smslocal.provider";

/**
 * Generic SMS Service Abstraction Layer.
 * Decouples the application & authentication system from specific SMS provider APIs.
 */
export class SmsService {
  private static provider: ISmsProvider;

  /**
   * Initializes and returns the configured SMS Provider instance.
   * Switches provider dynamically based on ENV.SMS_PROVIDER setting.
   */
  private static getProvider(): ISmsProvider {
    if (!this.provider) {
      const selectedProvider = (ENV.SMS_PROVIDER || "smslocal").toLowerCase();

      switch (selectedProvider) {
        case "smslocal":
          this.provider = new SmsLocalProvider();
          break;
        default:
          console.warn(`⚠️ [SmsService] Unknown SMS_PROVIDER '${selectedProvider}'. Defaulting to SmsLocalProvider.`);
          this.provider = new SmsLocalProvider();
          break;
      }
    }
    return this.provider;
  }

  /**
   * Application-level method to send an OTP code to a mobile number.
   * The authentication system calls this generic method without knowing which provider is used.
   *
   * @param phoneNumber 10-digit mobile number
   * @param otp 6-digit verification code
   */
  static async sendOtp(phoneNumber: string, otp: string): Promise<ISmsResult> {
    const provider = this.getProvider();
    console.log(`📡 [SmsService] Delegating OTP dispatch to active provider adapter: '${provider.name}'`);
    return provider.sendOtp(phoneNumber, otp);
  }

  /**
   * Diagnostic: Retrieves remaining SMS credits from the active provider.
   */
  static async getCredits(): Promise<any> {
    const provider = this.getProvider();
    if (provider.getCredits) {
      return provider.getCredits();
    }
    return { message: `Provider '${provider.name}' does not implement getCredits()` };
  }

  /**
   * Diagnostic: Retrieves message delivery status from the active provider.
   */
  static async getDeliveryStatus(messageId: string): Promise<any> {
    const provider = this.getProvider();
    if (provider.getDeliveryStatus) {
      return provider.getDeliveryStatus(messageId);
    }
    return { message: `Provider '${provider.name}' does not implement getDeliveryStatus()` };
  }
}
