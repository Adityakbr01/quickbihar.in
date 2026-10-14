import { resend, RESEND_FROM } from "../config/resend.config";
import { ENV } from "../config/env.config";

export class MailService {
  static async sendApplicationStatus(email: string, status: string, reason?: string) {
    const isApproved = status === "APPROVED";
    const subject = isApproved ? "Application Approved! - Quick Bihar" : "Application Update - Quick Bihar";

    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Application Status: ${status}</h2>
            <p>Your application to join Quick Bihar as a partner has been ${status.toLowerCase()}.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            ${isApproved ? `<p>You can now log in and access your partner dashboard.</p>` : "<p>If you have any questions, please contact support.</p>"}
          </div>
        `,
      });
      if (error) {
        console.error("❌ Resend Application Status Mail Error:", JSON.stringify(error, null, 2));
      }
    } catch (error) {
      console.error("❌ Mail Service Status Error:", error);
    }
  }

  static async sendAdminInvite(email: string, role: string, inviteUrl: string, fullName?: string, message?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
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
        console.error("❌ Invite Mail Error:", JSON.stringify(error, null, 2));
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Invite Mail Service Error:", error);
      return false;
    }
  }

  static async sendPayoutNotice(email: string, amount: number, status: string, referenceId?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
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
      if (error) {
        console.error("❌ Payout Mail Error:", JSON.stringify(error, null, 2));
      }
    } catch (error) {
      console.error("❌ Payout Mail Service Error:", error);
    }
  }

  /**
   * Send a password-reset email with real clickable links (not the raw token).
   * The web button targets the dashboard reset page
   * (/auth/reset-password?token=…); the app button targets the Expo deep link
   * (/auth/reset-password-confirm?token=…). A plain-text URL fallback is
   * included for email clients that strip buttons. Tokens expire in 15 min.
   */
  static async sendResetPasswordLink(email: string, token: string) {
    // Keep in sync with dash-web/src/App.tsx (/auth/reset-password) and
    // mobile/app/auth/reset-password-confirm.tsx (QuickBihar:// deep link).
    const dashboardBase = (ENV.DASHBOARD_URL || "https://dashboard.quickbihar.in").replace(/\/+$/, "");
    const encoded = encodeURIComponent(token);
    const webUrl = `${dashboardBase}/auth/reset-password?token=${encoded}`;
    const appUrl = `QuickBihar://auth/reset-password-confirm?token=${encoded}`;
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject: "Reset your Quick Bihar password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reset your password</h2>
            <p>We received a request to reset the password for your Quick Bihar account.</p>
            <p style="margin: 20px 0;">
              <a href="${webUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset password on web</a>
            </p>
            <p>On the mobile app? Open this link on your phone:</p>
            <p style="margin: 12px 0;">
              <a href="${appUrl}" style="display:inline-block;padding:12px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">Open in Quick Bihar app</a>
            </p>
            <p style="color:#666;font-size:13px;">If the buttons don't work, copy this link into your browser:</p>
            <p style="color:#666;font-size:13px;word-break:break-all;">${webUrl}</p>
            <p>This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        console.error("❌ Reset Link Mail Error:", JSON.stringify(error, null, 2));
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ Reset Link Mail Service Error:", error);
      return false;
    }
  }
}
