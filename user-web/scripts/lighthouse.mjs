/**
 * Lighthouse audit runner for QuickBihar user-web.
 *
 * - Auto-starts `vite preview` if the target URL is unreachable (waits up to 30s), kills it afterwards.
 * - Runs Lighthouse for --form-factor=mobile|desktop|both with proper screenEmulation.
 * - Saves HTML + JSON reports to lighthouse-reports/.
 * - Prints category bars + FCP/LCP/TBT/CLS/SI, exits non-zero if any category < --threshold (default 85).
 *
 * Usage:
 *   node scripts/lighthouse.mjs [--url=http://localhost:4173/clothing/home] [--form-factor=both] [--threshold=85] [--port=4173]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    return m ? [m[1], m[3] ?? "true"] : [a, "true"];
  }),
);

const FORM_FACTOR = (args["form-factor"] || "both").toLowerCase();
const THRESHOLD = Number(args.threshold ?? 85);
const PORT = Number(args.port ?? 4173);
const TARGET_URL =
  args.url || `http://localhost:${PORT}/clothing/home`;
const OUT_DIR = path.resolve(process.cwd(), "lighthouse-reports");

async function isReachable(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isReachable(url)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Auto-start vite preview if needed (Windows-compat: shell:true).
  let previewProc = null;
  if (!(await isReachable(TARGET_URL))) {
    console.log(`[lighthouse] ${TARGET_URL} unreachable — starting "vite preview"...`);
    previewProc = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
      shell: true,
      stdio: "inherit",
    });
    const ok = await waitForUrl(TARGET_URL, 30000);
    if (!ok) {
      console.error("[lighthouse] vite preview did not become reachable within 30s.");
      try {
        previewProc.kill();
      } catch {}
      process.exit(1);
    }
    console.log("[lighthouse] vite preview reachable.");
  }

  // Defensive CJS/ESM interop for chrome-launcher.
  const m = await import("chrome-launcher");
  const launcher = m.default ?? m;
  const lighthouseMod = await import("lighthouse");
  const lighthouse = lighthouseMod.default ?? lighthouseMod;

  const factors =
    FORM_FACTOR === "both" ? ["mobile", "desktop"] : [FORM_FACTOR];
  if (!factors.every((f) => f === "mobile" || f === "desktop")) {
    console.error(`[lighthouse] invalid --form-factor=${FORM_FACTOR} (use mobile|desktop|both)`);
    process.exit(1);
  }

  let failed = false;
  const chromeFlags = ["--headless", "--no-sandbox", "--disable-gpu", "--no-first-run"];

  for (const factor of factors) {
    console.log(`\n[lighthouse] Auditing ${factor}: ${TARGET_URL}`);
    const chrome = await launcher.launch({ chromeFlags });
    try {
      const screenEmulation =
        factor === "mobile"
          ? {
              mobile: true,
              width: 360,
              height: 640,
              deviceScaleFactor: 2,
              disabled: false,
            }
          : {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            };
      const options = {
        logLevel: "info",
        output: ["html", "json"],
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor: factor,
        screenEmulation,
        port: chrome.port,
      };
      const result = await lighthouse(TARGET_URL, options);
      // result.report is an ARRAY when output is ["html","json"]: index 0→html, 1→json.
      const [htmlReport, jsonReport] = Array.isArray(result.report)
        ? result.report
        : [result.report, null];
      const lhr = result.lhr;

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const base = path.join(OUT_DIR, `${factor}-${stamp}`);
      if (typeof htmlReport === "string")
        fs.writeFileSync(`${base}.html`, htmlReport);
      if (typeof jsonReport === "string")
        fs.writeFileSync(`${base}.json`, jsonReport);
      else fs.writeFileSync(`${base}.json`, JSON.stringify(lhr, null, 2));
      console.log(`[lighthouse] Saved ${base}.html + .json`);

      const cats = lhr.categories || {};
      const bar = (score) => {
        const pct = Math.round((score ?? 0) * 100);
        const filled = Math.round(pct / 5);
        return `${"█".repeat(filled)}${"░".repeat(20 - filled)} ${pct}`;
      };
      for (const key of ["performance", "accessibility", "best-practices", "seo"]) {
        const s = cats[key]?.score ?? 0;
        console.log(`  ${key.padEnd(15)} ${bar(s)}`);
        if (Math.round(s * 100) < THRESHOLD) {
          console.error(`  ✗ ${key} below threshold ${THRESHOLD}`);
          failed = true;
        }
      }

      const audits = lhr.audits || {};
      const metric = (id) => audits[id]?.displayValue ?? audits[id]?.numericValue ?? "n/a";
      console.log(`  FCP  ${metric("first-contentful-paint")}`);
      console.log(`  LCP  ${metric("largest-contentful-paint")}`);
      console.log(`  TBT  ${metric("total-blocking-time")}`);
      console.log(`  CLS  ${metric("cumulative-layout-shift")}`);
      console.log(`  SI   ${metric("speed-index")}`);

      // Top insights: render-blocking, LCP breakdown, unused-JS, cache TTL.
      const insights = [
        "render-blocking-resources",
        "largest-contentful-paint-element",
        "unused-javascript",
        "uses-long-cache-ttl",
        "bootup-time",
      ];
      console.log("  Top insights:");
      for (const id of insights) {
        const a = audits[id];
        if (!a) continue;
        const title = a.title || id;
        const dv = a.displayValue ? ` — ${a.displayValue}` : "";
        const score = typeof a.score === "number" ? ` (score ${Math.round(a.score * 100)})` : "";
        console.log(`   • ${title}${dv}${score}`);
      }
    } finally {
      try {
        await chrome.kill();
      } catch {}
    }
  }

  if (previewProc) {
    try {
      previewProc.kill();
    } catch {}
  }

  if (failed) {
    console.error(`\n[lighthouse] FAIL: one or more categories < threshold ${THRESHOLD}`);
    process.exit(1);
  }
  console.log("\n[lighthouse] All categories ≥ threshold. Done.");
}

main().catch((err) => {
  console.error("[lighthouse] Unexpected error:", err);
  process.exit(1);
});
