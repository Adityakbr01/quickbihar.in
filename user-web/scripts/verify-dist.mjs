#!/usr/bin/env node
/**
 * Post-build verification for the prerendered dist.
 *
 * Exists because a blank site reached production once (2026-10-17): async
 * post-build compression raced a `process.exit` scheduled 100ms into the
 * closeBundle chain (rollup runs closeBundle hooks in reverse order), so
 * oversized .gz artifacts shipped empty. With `gzip_static on` in nginx and
 * Cloudflare always requesting origin with `Accept-Encoding: gzip`, every
 * page rendered as an empty 200. This gate fails `npm run build` whenever:
 *
 *  - any emitted .html file is 0 bytes (prerender wrote an empty page), or
 *  - any .gz / .br codec artifact is 0 bytes (mid-write exit), or
 *  - fewer than 20 prerendered route pages exist (catalog discovery broke).
 *
 * Exit code 1 = build artifact corrupt; deploy pipelines must stop.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST_ROOT = 'dist'

let htmlPages = 0
const offenders = []

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full)
      continue
    }
    if (full.endsWith('.html')) {
      htmlPages += 1
      const size = statSync(full).size
      if (size === 0) offenders.push(`empty html: ${full}`)
      else if (size < 1024) offenders.push(`suspiciously small html (<1kb): ${full} (${size}b)`)
      continue
    }
    if (full.endsWith('.gz') || full.endsWith('.br')) {
      if (statSync(full).size === 0) offenders.push(`empty artifact: ${full}`)
    }
  }
}

try {
  walk(DIST_ROOT)
} catch {
  console.error(`verify-dist: dist/ unreadable — build produced nothing. Aborting.`)
  process.exit(1)
}

if (htmlPages < 20) {
  offenders.push(`prerendered page count too low: found ${htmlPages}, expected >= 20`)
}

if (offenders.length > 0) {
  console.error(`\n${'='.repeat(70)}\nverify-dist FAILED — corrupt artifacts present:\n`)
  for (const line of offenders) console.error(`  ✗ ${line}`)
  console.error(`\nDeploying this dist would blank the live site. Fix the build first.\n${'='.repeat(70)}\n`)
  process.exit(1)
}

console.log(`verify-dist OK: ${htmlPages} html pages, all .gz/.br artifacts non-empty`)
