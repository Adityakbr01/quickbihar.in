/**
 * Shared helpers for Expo Router static-export manifest loading and
 * `generateStaticParams` construction.
 *
 * Pattern:
 *   const manifest = loadManifest("@/src/data/products-static.json");
 *   export async function generateStaticParams() {
 *     return manifestToStaticParams(manifest, "id", "product/[id]");
 *   }
 */


/**
 * Convert a slug-keyed manifest into the array format `generateStaticParams` needs,
 * hard-failing (process.exit 1) if the manifest is empty.
 *
 * An empty manifest means `generate:manifest` either wasn't run or returned zero
 * results — deploying silently with zero pages is the exact production bug this
 * migration is designed to prevent.
 *
 * @param manifest  The object returned by `loadManifest`
 * @param paramKey  The dynamic segment name, e.g. "id" or "slug"
 * @param context   Label used in log messages, e.g. "product/[id]"
 */
export function manifestToStaticParams<K extends string>(
  manifest: Record<string, any>,
  paramKey: K,
  context: string
): Array<Record<K, string>> {
  const keys = Object.keys(manifest);
  if (keys.length === 0) {
    console.error(
      `[${context}] generateStaticParams: manifest is empty or missing.\n` +
      `  Run "bun run generate:manifest" before "expo export --platform web".\n` +
      `  Refusing to continue — zero pages would be deployed silently.`
    );
    process.exit(1);
  }
  console.log(`[${context}] Generating static pages for ${keys.length} slugs.`);
  return keys.map((key) => ({ [paramKey]: key } as Record<K, string>));
}

/**
 * Assert that a live-fetched array is non-empty, hard-failing if it is.
 * Use this in `generateStaticParams` functions that fetch from the API at
 * build time rather than reading a manifest file (e.g. category).
 */
export function requireNonEmpty<T>(
  items: T[],
  context: string,
  hint = "Check the API response shape and ensure the server is reachable."
): T[] {
  if (items.length === 0) {
    console.error(
      `[${context}] generateStaticParams: API returned 0 items.\n` +
      `  ${hint}\n` +
      `  Refusing to continue — zero pages would be deployed silently.`
    );
    process.exit(1);
  }
  return items;
}
