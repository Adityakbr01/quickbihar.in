# QuickBihar — Google Search Console Setup

Step-by-step to get `quickbihar.in` verified, submitted, and monitored in
[Google Search Console](https://search.google.com/search-console)
(per [Maintain your site's SEO](https://developers.google.com/search/docs/fundamentals/get-started)
+ [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)).

> Code references below are verified against this repo. Run the
> **pre-flight checks (§4)** before submitting anything — a failed
> prerender or wrong env is the #1 reason GSC shows errors on this stack.

---

## 1. Add the property

1. Search Console → **Add property**.
2. Choose **Domain** (not URL prefix) and enter `quickbihar.in`.
   - Covers apex, `www` (301s to apex), and `dashboard.quickbihar.in`.
   - Requires DNS verification (§2). If you cannot edit DNS, use URL-prefix
     `https://quickbihar.in/` + HTML-tag verification (§2b) instead.

## 2. Verify ownership

### 2a. DNS TXT (recommended, no code change)

1. Copy the TXT value Search Console shows (`google-site-verification=...`).
2. Add it as a **TXT record on `_dnsverify.quickbihar.in`** (or apex, per the
   prompt) at your DNS provider.
3. Click **Verify**. Leave the record in place permanently.

### 2b. HTML tag (fallback if DNS is unavailable)

1. In Search Console choose the `<meta name="google-site-verification">` method
   and copy your token.
2. Add it in **two** places so it survives rebuilds **and** client navigation:
   - `mobile/scripts/prerender-seo.ts` → `injectMetadata()` tags array:
     `<meta name="google-site-verification" content="TOKEN" />`
   - `mobile/src/components/seo/SeoHead.tsx` → inside `<Head>`, same tag
     (render only on the home route, or gate behind `meta.canonical` ending `/`).
3. Rebuild + redeploy, then view-source `https://quickbihar.in/` and confirm
   the tag is present in static HTML. Click **Verify**.
4. ⚠️ Never remove the tag — verification lapses and data stops.

### 2c. HTML file (not recommended on this stack)

`location /` proxies to the Expo static host and there is no
`server/public/` dir, so a `googleXXXX.html` file has nowhere to land without
an extra nginx `location = /googleXXXX.html` block. Prefer 2a or 2b.

## 3. Submit the sitemap

Sitemaps → **Add a new sitemap**: `https://quickbihar.in/sitemap.xml`

That index auto-declares the 5 shards (served by `server/src/modules/common/seo/`,
proxied by `vps-nginx/quickbihar.conf:148-179` — no Expo rebuild needed):

| Shard | Contents |
|---|---|
| `sitemap-static.xml` | `/`, `/clothing/search`, `/top-selling`, `/mall`, `/instant-delivery` |
| `sitemap-locations.xml` | `/locations/bihar/buxar` + 11 block pages |
| `sitemap-taxonomy.xml` | active `/category/:slug` |
| `sitemap-malls.xml` | approved `/mall/:slug` |
| `sitemap-products.xml` | gated products only (active + APPROVED + image + desc ≥ 20 chars) |

Expected status after a few days: **Success** on the index + each shard with
a discovered-URL count. `Couldn't fetch` / `Sitemap is HTML` = the request hit
the SPA fallback instead of the backend — check nginx ordering (§6).

## 4. Pre-flight checks (run before §3 and §5)

```bash
# Sitemap + shards return XML (not index.html)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://quickbihar.in/sitemap.xml
for s in static products taxonomy malls locations; do
  curl -s -o /dev/null -w "$s: %{http_code} %{content_type}\n" "https://quickbihar.in/sitemap-$s.xml"
done

# robots.txt: production rules + sitemap reference
curl -s https://quickbihar.in/robots.txt

# Product page: unique title/canonical/OG + indexable (NOT the generic fallback)
curl -s https://quickbihar.in/product/<a-real-slug> | grep -o -m1 "<title>.*</title>"
curl -s https://quickbihar.in/product/<a-real-slug> | grep -o -m1 'name="robots" content="[^"]*"'
# ^ must print index, follow. If you see "Product Detail | QuickBihar" +
# noindex, the build-time prerender fetch failed — rebuild with the API reachable.
```

## 5. Request indexing (URL Inspection → Request Indexing, in order)

Google finds the rest via sitemap + internal links, but push these first:

1. `https://quickbihar.in/`
2. `https://quickbihar.in/locations/bihar/buxar`
3. `https://quickbihar.in/locations/bihar/buxar/buxar-city`
4. `https://quickbihar.in/locations/bihar/buxar/dumraon`
5. `https://quickbihar.in/mall` + 1–2 best `/product/:slug` URLs
6. Remaining blocks: `chausa`, `itarhi`, `rajpur`, `nawanagar`, `brahampur`,
   `simri`, `chaugain`, `kesath`, `chakki`

Do **not** submit: `/auth`, `/clothing/cart`, `/account/*`, `/checkout`,
`/order/*`, `/track-order/*`, `/rider`, or any `?q=` / `?categoryId=` URL
(all `noindex` + robots-blocked by design).

## 6. Troubleshooting

| Symptom in GSC | Cause on this stack | Fix |
|---|---|---|
| Sitemap `Couldn't fetch` / is HTML | Host nginx served Expo fallback, not backend. **CI does NOT reload host nginx** — `vps-nginx/quickbihar.conf` must be synced to the VPS and reloaded manually | On VPS: copy conf → `sudo nginx -t && sudo systemctl reload nginx`; re-run §4 curls (expect `application/xml`, not `text/html`) |
| `Robots.txt unreachable` / shows SPA HTML | Same host-nginx cause (verified live Sep 2026: `/robots.txt` returned homepage HTML) | Same fix as above; non-prod `NODE_ENV` also serves `Disallow: /` — VPS env must be `production` |
| Product page `Excluded: noindex` | prerender emitted generic fallback (0 products fetched at build) | Rebuild with `EXPO_PUBLIC_API_ORIGIN` reachable; re-check §4 |
| `Duplicate without user-selected canonical` on `/clothing/home` or `/product/:id` | Expected — aliases canonicalize to `/` / slug URL | No action; confirm canonical tag points at the primary |
| `Crawled — currently not indexed` on new PDPs | Normal for a new domain; budget-limited | Keep sitemap fresh (automatic), build internal links + reviews; re-request after content grows |

## 7. Ongoing monitoring (weekly, 10 min)

- **Pages → Indexed / Not indexed**: trend should slope toward indexed; new
  `noindex` or `Not found (404)` spikes = check last deploy first.
- **Sitemaps**: shard counts should grow with catalog (products/malls).
- **Core Web Vitals + PageSpeed Insights**: mobile LCP/INP/CLS on `/`, one PDP,
  one location page — Expo RN-web bundles are the main risk.
- **Rich results**: Product / FAQ / Breadcrumb validity after each SEO deploy
  (also spot-check with the Rich Results Test).
- **Performance**: clicks/impressions for `buxar`, `dumraon`, category terms;
  add Hindi/Hinglish queries once location pages index.
