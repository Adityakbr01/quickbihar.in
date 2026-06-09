import { Resend } from "resend";
import { ENV } from "../config/env.config";

const resend = new Resend(ENV.RESEND_API_KEY);

export class MailService {
  static async sendOTP(email: string, otp: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: "no-reply@edulaunch.shop", // Replace with your verified domain
        to: [email],
        subject: "Your Quick Bihar Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Verification Code</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">Your one-time password (OTP) for Quick Bihar is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; 2024 Quick Bihar. All rights reserved.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend Error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Mail Service Error:", error);
      return false;
    }
  }

  static async sendApplicationStatus(email: string, status: string, reason?: string) {
    const isApproved = status === "APPROVED";
    const subject = isApproved ? "Application Approved! - Quick Bihar" : "Application Update - Quick Bihar";

    try {
      await resend.emails.send({
        from: "Quick Bihar <onboarding@resend.dev>",
        to: [email],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Application Status: ${status}</h2>
            <p>Your application to join Quick Bihar as a partner has been ${status.toLowerCase()}.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            ${isApproved ? `<p>You can now log in and access your partner dashboard.</p>` : "<p>If you have any questions, please contact support.</p>"}
          </div>
        `
      });
    } catch (error) {
      console.error("Mail Service Status Error:", error);
    }
  }

  static async sendAdminInvite(email: string, role: string, inviteUrl: string, fullName?: string, message?: string) {
    try {
      const { error } = await resend.emails.send({
        from: "Quick Bihar <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to Quick Bihar as ${role}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Quick Bihar Invitation</h2>
            <p>Hello${fullName ? ` ${fullName}` : ""},</p>
            <p>You have been invited to join Quick Bihar with the role <strong>${role}</strong>.</p>
            ${message ? `<p>${message}</p>` : ""}
            <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Open Quick Bihar</a></p>
          </div>
        `,
      });

      if (error) {
        console.error("Invite Mail Error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invite Mail Service Error:", error);
      return false;
    }
  }

  static async sendPayoutNotice(email: string, amount: number, status: string, referenceId?: string) {
    try {
      await resend.emails.send({
        from: "Quick Bihar <payments@resend.dev>",
        to: [email],
        subject: `Payout ${status} - Quick Bihar`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Payout Update</h2>
            <p>Your payout of <strong>₹${amount}</strong> is marked as <strong>${status}</strong>.</p>
            ${referenceId ? `<p>Reference: ${referenceId}</p>` : ""}
          </div>
        `,
      });
    } catch (error) {
      console.error("Payout Mail Service Error:", error);
    }
  }
}
