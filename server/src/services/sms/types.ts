/**
 * Generic SMS Result interface returned by all SMS provider adapters.
 */
export interface ISmsResult {
  /** Whether the SMS request was accepted/sent successfully by the provider */
  success: boolean;

  /** Unique Message ID assigned by the provider (if available) */
  messageId?: string;

  /** Numerical or string error code returned by the provider */
  errorCode?: string;

  /** Human-readable description of error (safe for internal logging) */
  errorMessage?: string;

  /** Raw response data from provider for diagnostics */
  rawResponse?: any;
}

/**
 * Generic SMS Provider interface contract.
 * Any new SMS gateway (Twilio, MSG91, Plivo, etc.) must implement this interface.
 */
export interface ISmsProvider {
  /** Name identifier of the provider adapter */
  readonly name: string;

  /**
   * Sends an OTP code to the target phone number.
   * @param phoneNumber Destination 10-digit mobile number
   * @param otp 6-digit verification code
   */
  sendOtp(phoneNumber: string, otp: string): Promise<ISmsResult>;

  /**
   * Retrieves delivery status for a sent message ID.
   * @param messageId Provider message ID
   */
  getDeliveryStatus?(messageId: string): Promise<any>;

  /**
   * Retrieves remaining credit balance from provider.
   */
  getCredits?(): Promise<any>;
}
