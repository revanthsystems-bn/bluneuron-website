# pages-polish — Phase 0 plan

Branch `pages-polish`, cut from `launch-site` @ `199c21d`. Nothing in this
plan is built yet.

Every page below keeps the homepage's existing system: `#000`/`#030303`/
`#0A0A0A`/`#121212` grounds, `rgba(255,255,255,.08/.12/.20)` hairlines,
`#3B82F6` / `#60A5FA` accent, Inter Tight, Zen Dots for the IRIZ wordmark,
`.btn-primary` white pill / `.btn-secondary` outlined pill, `.section-container`
at 1440px with 24/40/64px gutters. Those values are copied into
`design-src/tokens.css` for the standalone design files; `tailwind.config.js`
remains the source of truth.

---

## Measured baseline (from `screenshots/pages-before/`)

Captured at 390 and 1440 on the real build. Three findings drive most of the
work:

**1. The pages genuinely are text documents.** Image count per page: homepage
20, `/shop/iriz` 10, `/shop` 4, `/where-to-buy` 4 — and **3 on every single
other page**, which is the logo plus two footer wordmarks. `/about`,
`/support`, `/support/faq` and all five policy pages contain zero product
imagery.

**2. Tap targets fail site-wide, not per page.** Between 25 and 36 controls
under 44px on *every* route. They are nearly all in two shared components:
footer links (~19–21px tall), the masthead icon buttons (40×40) and burger
(38×38). The homepage carousel dots are 6×6. Fixing `Header` and `Footer`
fixes ~20 of them on all 21 routes at once.

**3. The 54px overflow on `/shop/iriz` at 390px is the gallery rail.**
Localised: `<ul class="-mx-6 … overflow-x-auto px-6">` measures 444px inside a
390px viewport, and its last `<li>` sits at x=420. The `-mx-6` bleed is applied
to an element that is already full-bleed, so it escapes the viewport rather
than just the container padding.

Also recorded: `/legal/privacy` is 7,142px tall at 390px and `/legal/terms`
6,543px, both with no table of contents.

---

## Per page

### `/shop/iriz` — mocked, see `mocks/shop-iriz.html`
- Gallery: 4:3 stage + thumbnail rail. Rail scrolls **inside its column** —
  that is the overflow fix. Swipe on mobile, thumbnails on desktop.
- Buy panel: eyebrow, title, tagline, price from `MARKETPLACE.priceInr`, one
  **Buy** opening the sheet. The qty stepper and "Add to cart" go with
  `CART_ENABLED=false`.
- Specs: 6-tile grid with icons (today it is an unstyled table).
- **New** "In the box" from `BOX_CONTENTS`, beside the real carton photo.
- **New** warranty band from `WARRANTY`, linking to registration.
- **New** FAQ accordion from `FAQS`.
- Sticky buy bar on mobile.

### `/shop`
- Same card language; real product photo rather than the current bare tile.
- Price, one Buy, link through to `/shop/iriz`.

### `/where-to-buy`
- Two store cards (Amazon, Flipkart), each stating what the store handles
  (payment, delivery, returns) versus what BluNeuron handles (warranty).
- Link to warranty registration.

### `/support` — mocked, see `mocks/support.html`
- Visual hero band using a still we already ship.
- FAQ search box (client-side filter over `FAQS` + `TROUBLESHOOTING`).
- Cards re-weighted: the two warranty actions lead, the other three follow.
  Today all six are equal, which is what makes it read as a sitemap.

### `/support/faq`
- Group by topic (Setup, Picture, Sound, Connectivity, Warranty).
- Animate open/close on `grid-template-rows` (today it is `hidden`, so it
  snaps).
- Deep-linkable: `id` per item, open from `location.hash`.

### `/support/warranty-registration`, `/support/warranty-claim`
- **Behaviour frozen.** Same fields, same validation, same Google Sheet
  endpoint, same mobile 2-step, form still above the fold after a QR scan.
- Visual polish only: panel treatment, field styling, focus rings, spacing.

### `/support/contact`
- Email and phone cards, a styled address block (Coimbatore), business hours.
- Form unchanged.

### Policy pages (`privacy`, `warranty`, `returns`, `shipping`, `terms`)
- **No legal wording changes.** `LegalPage.jsx` is the single component, so
  this is one edit for all five.
- Title block with "Last updated".
- Sticky TOC on desktop from the existing `sections[].heading` array;
  collapsible `<details>` on mobile.
- Prose stays at the current 680px (~70 characters).
- Key-point callout boxes — warranty period, return window — rendered from a
  new optional `highlight` key on a section, so the copy itself is untouched.

### `/about`
- Hero image of the IRIZ.
- Existing "Why IRIZ" and "Our approach" copy, given visual structure.
- "Designed in Coimbatore" block using the registered address already in
  `lib/site-config.js`.
- **Placeholder, clearly marked**, for founder photo and story. No invented
  history.

---

## Images to replace (Step 2b)

Replaced with **new images**, not text. Built as HTML in `design-src/images/`,
rendered to 2x with `design-src/render.mjs`, using real photos from
`public/media/`. Before/after will be shown per image.

| File | Why it has to go | Replacement |
|---|---|---|
| `detail/11-apps-10000.png` | Google TV home screen; Netflix, Disney+, Prime Video, Spotify, YouTube and Play marks; AI-garbled film posters | Generic Android launcher, generic tiles, no third-party marks |
| `detail/09-screen-size.png` | Screen ladder starts at **35"**; sub-head says "1.4–5 meters" | Ladder 40"–200", distance 0.9–5m |
| `detail/02-spec-sheet.png` | Prints "**35-200 Inch** Projection Size" | 40"–200" |

Same canvas size and visual weight in each case, so no layout changes
downstream.

**Flagged, not actioned without a decision:**
- `detail/06-chipset.png` carries the Android robot mark beside "Android 14.0
  OS". The box does claim Android 14, and this is not Google TV or Hey Google,
  so it is outside the stated criteria — but it is a third-party logo.
- `/shop/iriz` states "10,000+ Official Apps — Netflix, YouTube, Disney+,
  Prime Video, and more — pre-installed" as **text** in `HIGHLIGHTS`. The
  no-third-party-logos rule was scoped to images; this is copy, and changing
  it would change a claim.
- The eyebrow on `/shop/iriz` and the homepage reads "Mini **portable**
  projector for home". The retail box makes no portability claim (no battery;
  power source listed as AC 90–240V). Under "everything must match the retail
  box" this should become "Mini projector for home" — one string in
  `lib/iriz.js`.

---

## Shared work (benefits every page)

- `Header`: icon buttons and burger to 44×44.
- `Footer`: link rows to a 44px target without changing the visual rhythm.
- Focus rings: visible `focus-visible` ring on every interactive element.
- Muted text: audit `text-white/40` and below against AA and lift where it
  fails.
- Motion: one shared reveal (fade + rise, once), hover lifts, accordion
  height animation — all inside `prefers-reduced-motion: no-preference`.

---

## Flags to add (Step 2a / 2d)

`NOTIFY_AUTO_OPEN = false`, `CART_ENABLED = false`, `ACCOUNTS_ENABLED = false`
in `lib/site-config.js`. None exist on this branch yet. `/cart` redirects to
the product page; `/account` and `/sign-in` render a "coming soon" panel. All
code stays.

## Buy sheet (Step 2c)

`components/buy/BuySheet.jsx` and `lib/buy-destinations.js` copied from
`ui-polish@a0213c6` — those two files only. While the marketplace URLs are
`PLACEHOLDER`, the store buttons fire a toast ("Store link goes live on sale
day") instead of navigating; no fake href is ever rendered. `buy_click {store}`
is the only event sent.
