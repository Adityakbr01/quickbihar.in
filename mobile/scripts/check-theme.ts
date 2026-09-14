// ponytail: one runnable check for theme wiring. Fails if anyone
// re-hardcodes dark mode or drops the toggle/persist path.
// Run: bun scripts/check-theme.ts
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf-8");

let fail = 0;
const t = (ok: boolean, name: string) => {
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) fail++;
};

const provider = read("src/theme/Provider/ThemeProvider.tsx");
t(provider.includes("localStorage?.getItem"), "provider sync-reads storage (0ms web refresh)");
t(/useState<ThemeMode \| null>\(getStoredMode\)/.test(provider), "no manual choice until user touches toggle");
t(provider.includes("useColorScheme()"), "system theme followed on all platforms");
t(provider.includes("manual ?? (systemScheme"), "manual choice wins, system fallback, dark last resort");
t(provider.includes("followSystem") && provider.includes("removeItem(STORAGE_KEY)"), "reset-to-system clears storage");
t(!provider.includes("toggleMode"), "no dead toggleMode API");
t(fs.existsSync(path.join(ROOT, "src/components/common/ThemeToggle.tsx")), "toggle lives in reusable common UI");
t(!fs.existsSync(path.join(ROOT, "src/features/common/account/components/ThemeToggle.tsx")), "no duplicate toggle copy");

const layout = read("app/_layout.tsx");
t(layout.includes("preventAutoHideAsync") && layout.includes("hideAsync"), "splash gated on theme ready");
t(!layout.includes("useColorScheme") && !layout.includes("#0f0f0f"), "layout follows theme, not device/hardcoded");

const account = read("src/features/common/account/screens/AccountMain.tsx");
t(
  account.includes("@/src/components/common/ThemeToggle") &&
    account.includes("theme.setMode(") &&
    account.includes("theme.followSystem()"),
  "account tab reuses common toggle (manual set + Auto reset)"
);

for (const f of [
  "app/locations/[...slug].tsx",
  "app/instant-delivery.tsx",
  "src/features/common/trackOrder/components/TrackingInfoCard.tsx",
  "src/features/Food/screens/FoodHomeScreen.tsx",
  "src/features/clothing/home/components/MoreDealsHeader.tsx",
  "src/features/common/auth/components/GoogleSignInButton.tsx",
  "src/features/common/auth/components/GoogleSignInButton.web.tsx",
]) {
  const src = read(f);
  t(/isDark/.test(src), `theme-aware ${f}`);
}
// No raw light-fixed surfaces left in adapted StyleSheets (light values may
// only survive inside an isDark ternary's light branch or on brand buttons).
for (const f of [
  "app/locations/[...slug].tsx",
  "src/features/common/trackOrder/components/TrackingInfoCard.tsx",
]) {
  const src = read(f);
  const raws = src.split("\n").filter(
    (l) => /backgroundColor:\s*"#(?:FFFFFF|F9FAFB|FAFAFA|F3F4F6|F5F5F5|F0F0F0|FDF9F4|FFF0E6|FFF9E6|F0FFF4|EEF2FF|FEF3C7|EFF6FF|FFF1F2|FFE4E6|FDF3D1|FFFEFA|F1F5F9)"|backgroundColor:\s*"white"/.test(l)
      && !l.includes("isDark")
  );
  t(raws.length === 0, `no raw light surfaces ${f}${raws.length ? " → " + raws.map((l) => l.trim()).join(" | ") : ""}`);
}

process.exit(fail ? 1 : 0);
