# QuickBihar SEO Automation — Baseline Complete (2026-10-19)

## Summary

✅ **Baseline audit completed** — Real evidence collected from live site, repository code, and sitemaps.

📁 **Created structure:**
```
seo-automation/
├── config/seo-policy.yaml
├── reports/2026-10-19.md (full report)
├── reports/2026-10-19.json (machine summary)
├── proposals/ (11 evidence-backed proposals)
│   ├── QB-SEO-20261019-001.md through QB-SEO-20261019-011.md
└── README.md (implementation guide)
```

## Key Findings (Evidence-Labeled)

| Issue | Evidence | Severity |
|-------|----------|----------|
| **GSC/GA4 API access missing** | BLOCKED — no service accounts configured | P0 |
| **Daily scheduler not configured** | BLOCKED — no GitHub Actions cron, no OpenSEO scheduler | P0 |
| **OpenSEO MVP not found in repo** | search_files returned 0 results | P3 |
| **Category pages NOT in STATIC_ROUTES** | 29 URLs in sitemap-taxonomy.xml, 0 in routes.ts | P2 |
| **`/clothing/home` duplicate route** | In STATIC_ROUTES but not in sitemap; historical GSC duplicate canonical | P1 |
| **Shell links identical across ALL pages** | Homepage, /jewelery/, /locations/bihar/buxar all show same 10 clothing products | P2 |
| **Jewellery products use wrong URL in shells** | CONFIRMED: homepage/location/jewelery index shells link to `/product/:slug` for jewellery items (should be `/jewelery/product/:slug`) | P1 |
| **Mall breadcrumb FIXED in code** | CONFIRMED: `/mall/aditya-fashion-mall` JSON-LD shows Home → Malls → Mall (not Clothing/Home) | P2 ✅ |
| **Prerender shell hidden from WRS** | `display:none` + `aria-hidden=true` on #qb-seo-shell | P1 |
| **Sitemap lastmod stale** | taxonomy: 2026-09-09 (40 days), malls: 2026-09-17 | P2 |
| **Only 1 mall in catalog** | malls-static.json has 1 entry | P3 |

## Critical Verification: Jewellery URL Canonicalization

**The fix in `prerender.tsx` (lines 370, 439, 494) is NOT reflected in live output.**

- Homepage shell: 10 clothing products only (no jewellery products shown)
- `/locations/bihar/buxar` shell: 10 clothing products only  
- `/jewelery/` index shell: 10 clothing products only (should show jewellery)
- `/jewelery/product/*` pages: Correctly show jewellery products with `/jewelery/product/:slug` format

**This means the ternary logic `jewel ? /jewelery/product/:slug : /product/:slug` is not being triggered** — likely because the shell's product selection only picks from the first 10 products which are all clothing.

## Immediate Next Steps (Priority Order)

### 1. P0 — Configure GSC/GA4 API Access (Proposal 009)
- Create Google Cloud service accounts
- Grant GSC Owner + GA4 Viewer permissions
- Store in GitHub Actions secrets
- Test API calls

### 2. P0 — Set Up Daily Scheduler (Proposal 010)
- Create `.github/workflows/seo-daily.yml` with cron: `'0 2 * * *'` (7:30 AM IST)
- Run: checkout → Node setup → install → audit script → commit reports/proposals

### 3. P1 — Verify/fix jewellery product URLs in shells (Proposal 004)
- The shell link selection logic needs to include jewellery products and use correct URL format
- Check `prerender.tsx` shell link generation logic

### 4. P1 — Replace hidden prerender shell (Proposal 006)
- Remove `display:none` from #qb-seo-shell
- Add visible lightweight styles for WRS/users

### 5. P1 — Remove `/clothing/home` duplicate (Proposal 001)
- Delete from `STATIC_ROUTES` in `routes.ts`
- Verify build and sitemap unchanged

## All Proposals Status: PENDING

No proposals approved, merged, or deployed. Human review required for all.

## Files Ready for Review

- **Full report:** `seo-automation/reports/2026-10-19.md`
- **JSON summary:** `seo-automation/reports/2026-10-19.json`
- **11 proposals:** `seo-automation/proposals/QB-SEO-20261019-001.md` through `011.md`
- **Config:** `seo-automation/config/seo-policy.yaml`
- **README:** `seo-automation/README.md`

---

**Next action:** Please review proposals and approve priority items (009, 010, 004, 006, 001) for implementation. I await your direction before making any code changes.