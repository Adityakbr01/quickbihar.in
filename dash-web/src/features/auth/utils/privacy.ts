/**
 * Mask a phone number for display in semi-trusted UIs (seller-facing customer
 * directory, etc.). The original plan: keep enough tail to disambiguate but
 * hide the middle so it can't be harvested at a glance.
 *
 * Examples:
 *   maskPhone("+919876543210") => "+91 98•••43210"
 *   maskPhone("9876543210")    => "98•••43210"
 *   maskPhone(undefined)       => "-"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "-";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 6) return "••••";
  // Show first 2 + last 5, mask the middle.
  const first = digits.slice(0, 2);
  const last = digits.slice(-5);
  const middleLen = Math.max(digits.length - 7, 3);
  return `${first}${"•".repeat(middleLen)}${last}`;
}

/**
 * Mask an email — keep the first 2 chars of the local part + the domain.
 *   maskEmail("aditya.kumar@quickbihar.in") => "ad••••@quickbihar.in"
 */
export function maskEmail(email?: string | null): string {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  if (!domain) return "••••";
  if (local.length <= 2) return `${local}••••@${domain}`;
  return `${local.slice(0, 2)}${"•".repeat(Math.min(local.length - 2, 6))}@${domain}`;
}
