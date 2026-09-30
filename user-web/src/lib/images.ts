/**
 * ImageKit delivery-URL helper (web).
 *
 * Per ImageKit's docs, format conversion needs NO backend change: appending
 * `tr=f-auto` to any ImageKit URL makes the CDN serve the best format the
 * browser supports (WebP on all modern browsers, AVIF where optimal),
 * including files uploaded years ago as JPEG/PNG. `w-<px>` adds on-the-fly
 * resizing so phones never download desktop-sized banners.
 *
 * - Only `ik.imagekit.io` URLs are touched; everything else passes through.
 * - Existing `tr` chains are extended, never replaced.
 * - Use for <img> `src` only — keep OG/Twitter meta on absolute originals.
 */

const IK_HOST = "ik.imagekit.io";

export function ikUrl(
  url: string | null | undefined,
  opts: { width?: number } = {},
): string {
  if (!url) return "";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== IK_HOST) return url;

  const parts: string[] = [];
  const existing = parsed.searchParams.get("tr");
  if (existing) parts.push(existing);
  if (opts.width && Number.isFinite(opts.width)) {
    parts.push(`w-${Math.round(opts.width)}`);
  }
  // f-auto last: format negotiation applies after resizing.
  if (!/(^|[,:/=])f-(auto|webp|avif)\b/i.test(url)) {
    parts.push("f-auto");
  }
  if (parts.length > 0) {
    parsed.searchParams.set("tr", parts.join(","));
  }
  return parsed.toString();
}

/** Width bucket for responsive banner requests (matches common viewports). */
export function bannerWidthBucket(viewportWidth: number): 768 | 1280 | 1920 {
  if (viewportWidth >= 1024) return 1920;
  if (viewportWidth >= 600) return 1280;
  return 768;
}
