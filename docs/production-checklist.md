# Before production

`npm run deploy` runs `scripts/check-production.js` first and refuses to
publish while any automated item below is unmet. The manual items are the
ones no script can see — they are listed because that is exactly why they get
forgotten.

Run the gate on its own at any time:

```bash
npm run check:production          # full, boots the build and crawls it
npm run check:production -- --skip-seo   # fast, static checks only
```

---

## Blocked by the gate (automated)

| # | Check | Where to fix |
|---|---|---|
| 1 | No `PLACEHOLDER` values | `lib/site-config.js` — real ASIN and both listing URLs |
| 2 | Supabase configured (not demo mode) | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time |
| 3 | Every referenced image exists | `npm run check:media`, see `docs/missing-media.md` |
| 4 | No `[TBD]` or masked phone on an indexable page | `npm run validate:seo` |

### The three PLACEHOLDER values

| Value | Current | Needs |
|---|---|---|
| `AMAZON_ASIN` | `PLACEHOLDER_ASIN` | the 10-character ASIN from the listing URL |
| `MARKETPLACE.amazonUrl` | `https://www.amazon.in/?PLACEHOLDER` | `https://www.amazon.in/dp/<ASIN>` |
| `MARKETPLACE.flipkartUrl` | `https://www.flipkart.com/?PLACEHOLDER` | `https://www.flipkart.com/<slug>/p/<itm-id>` |

---

## NOT blocked by the gate (manual — check these yourself)

### Secrets that must exist on the Worker

`scripts/check-production.js` cannot see Cloudflare secrets, so it cannot
fail on their absence. Without them, warranty registration returns a 503 and
the form shows an error — the site works, registration does not.

```bash
npx wrangler secret put GOOGLE_APPS_SCRIPT_URL
npx wrangler secret put GOOGLE_APPS_SCRIPT_TOKEN
npx wrangler secret list        # confirm both are present
```

### The Google Sheet's sharing

**The warranty Sheet must be shared with named team members only — never
"Anyone with the link".** It holds customer names, email addresses, phone
numbers, order IDs and serial numbers. A link-shared sheet is a customer
database anyone who has ever seen the link can read, and nothing in this
repository can detect that.

Check: Sheet → **Share** → General access must read **Restricted**.

### Supabase

- `supabase/migrations/0001_accounts.sql` and `0002_registration_sync.sql`
  both run.
- `supabase/rls-tests.sql` → 17 PASS.
- `supabase/0002-tests.sql` → 7 PASS.
- Custom SMTP configured, so OTP emails come from `support@bluneuron.com`
  rather than Supabase's shared sender. See `docs/supabase-setup.md`.

### Flags that change what customers see

| Flag | File | Today | Turn on when |
|---|---|---|---|
| `SHOW_BUY` | `lib/site-config.js` | `true` | — on for this branch so the buy flow is reviewable |
| `DIRECT_SALES_ENABLED` | `lib/site-config.js` | `false` | this site takes its own payments. Adds "BluNeuron Website" to the purchase-source options on the warranty forms and to `AUTHORISED_PURCHASE_SOURCES`, so a direct sale stops being flagged for verification. Nothing else needs editing — the Postgres CHECK constraint already allows the value, and the Apps Script already accepts it. |
| `COMMERCE_ENABLED` | `lib/launch.js` | `false` | the in-site cart is revived (it is not; the basket hands off to a marketplace) |
| `SHOW_PENDING_SPECS` | `lib/iriz.js` | `false` | dimensions, weight and box contents are confirmed |
| `SHOW_PRIVACY` | `lib/iriz.js` | `true` | — |

### Still unknown, and still hiding rather than showing a placeholder

- **Helpline** — `SUPPORT.phone` is `[TBD]`; every phone row is hidden.
- **Grievance officer** — `GRIEVANCE_OFFICER` is `[TBD]`, so `/legal/grievance`
  stays a draft (noindex, out of the sitemap, dropped from the footer).
- **Grievance timelines** — `[TBD]` on that page.
- **Manual PDFs** — `MANUALS[].file` is `[TBD]`; `/support/manuals` is a draft.
- **GSTIN** — `COMPANY.gstin` is `''`; the footer prints the identity line
  without it.

### Tests worth running before a release

```bash
npm run build          # with .env.production sourced
npm run check:media
npm run validate:seo
npm run test:cart      # real browser, 390/770/1440 — needs a running server
```
