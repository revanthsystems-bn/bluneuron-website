@AGENTS.md

# What is live, and where

**`https://www.bluneuron.com` is served by Cloudflare Workers, deployed with
wrangler from the `cloudflare` branch.** That is the production site. Read
this before believing any sentence elsewhere in this file that says the live
site runs on Vercel — several do, they describe how it used to be, and they
are being corrected section by section rather than all at once.

**What is live right now: the launched Flipkart-only site.** Worker version
`f4adc2df-69e0-412e-b80c-e25e4d386a63`, deployed 2026-10-30 from the
`club-v1` launch branch after a pre-launch audit. `club-v1` was merged into
`cloudflare` and into `main` immediately afterwards, so all three now carry
the same code and `cloudflare` again matches what is deployed. The rollback
target — the pre-launch site, with the DRAFT legal pages — is
`npx wrangler rollback 1867b9b4-d8b4-4d75-9213-af0235868031`.

THE DEPLOY DID NOT COME FROM `cloudflare`, and that is worth knowing because
it is the one time the rule below was not how it happened: the Worker was
built and deployed from `club-v1`, and `cloudflare` was brought up to match
afterwards rather than before. Nothing is wrong with the result — the two
branches are identical — but if the two ever disagree again, believe
`npx wrangler deployments list`, not the branch name.

- **Vercel no longer serves the domain.** A Vercel deployment may still
  exist and still build, but nothing a visitor sees comes from it.
- **`main` is not live, and still is not.** It now carries the same code as
  the live Worker, which it did not before 2026-10-30 — but nothing deploys
  from it and merging into it still ships nothing. `iriz-launch` is older
  than all of this and is not live either.
- **Workers Builds is not connected to the repo.** Pushing to `cloudflare`
  does **not** redeploy. Every deployment is a manual `wrangler deploy` from
  a developer's machine, which means a `wrangler deploy` run here changes
  the live site immediately — treat it as shipping, and confirm before
  running it. `npx wrangler deployments list` shows what is actually out
  there.
- **One thing is live and broken, and it is not in this repository.** The
  Google Apps Script behind warranty registration still refuses the
  `Authorised dealer / store` and `Other seller` purchase sources with a
  502, so those customers cannot register. `Code.gs` here has all four
  sources and `npm run test:codegs` passes against it — the deployed Web App
  is an older version. Fixing it means redeploying the Apps Script (Deploy →
  Manage deployments → edit → Version: New version), not editing this repo.

## Building locally on this machine

Two things differ from a clean checkout, and both look like project bugs:

- **Node 22 for anything touching wrangler.** The system Node is 20, and
  wrangler refuses to start below 22. A portable Node 22 lives at
  `C:\Users\MEENA\AppData\Local\node22\node-v22.23.3-win-x64\` — prepend
  **that** to `PATH`, not its parent. `node22\` alone is the extraction
  folder and contains no `node.exe`, so putting it on `PATH` fails with
  `Wrangler requires at least Node.js v22.0.0` and looks exactly like Node 22
  not being installed. `next build` itself is fine on Node 20.

  ```bash
  export PATH="/c/Users/MEENA/AppData/Local/node22/node-v22.23.3-win-x64:$PATH"
  ```
- **`.env.local` overrides `.env.production`.** Next loads `.env.local` at
  higher priority, and the local one sets `NEXT_PUBLIC_META_PIXEL_ID` and
  `NEXT_PUBLIC_WEB3FORMS_KEY` to EMPTY — so `scripts/assert-build-env.js`
  aborts a build that would otherwise pass. **Never edit `.env.local`.**
  Source the committed public values for the build instead:

  ```bash
  set -a; . ./.env.production; set +a
  ```

# Working rules

- **Work on feature branches.** Never commit directly to `main`.
- **Never push to `main`**, and never merge into it, without an explicit
  "ship to main". `main` is not the live branch any more, but it is still
  the repository's trunk and still not somewhere to push unasked.
- **Never deploy to production without being asked.** `wrangler deploy` on
  the `cloudflare` branch IS production. Use `wrangler versions upload` for
  a preview URL instead.
- **Never force-push.** Any branch, any time.
- **Never commit `.env.local`**, or any file holding a real secret.
  `.env.example` is committed and holds variable NAMES only.
- **Never commit the launch video** (`Launch video  2.mov`, ~65 MB). It is
  not tracked and must stay that way — it would push the repo past the
  100 MB upload limit GoDaddy enforces. Large media belongs in
  `public/media/` only when it is genuinely needed by a page, and compressed
  (see the existing `iriz-loop.mp4` / `.webm` pair at under 1 MB each).

# Hosting: GoDaddy Node.js (`godaddy` branch)

The live site runs on **Cloudflare Workers from `cloudflare`** — see *What is
live, and where* at the top of this file. The `godaddy` branch is the
GoDaddy Node.js Hosting build, and everything in this section exists because
GoDaddy's deployment model differs from Vercel's in ways that fail silently
rather than loudly. The site must keep working on **both** — nothing here may
be a GoDaddy-only hack that breaks the Vercel deploy.

## Start script, PORT and 0.0.0.0

```json
"start": "next start -H 0.0.0.0"
```

The host assigns a port through the `PORT` environment variable and proxies
to it. Two things make this work:

- **`PORT` is read by Next itself.** In Next 16 the `next start` port option
  is declared `.default(3000).env('PORT')`, so `PORT=4000 npm start` listens
  on 4000 with no flag. **Do not** write `-p ${PORT:-3000}` — that is POSIX
  shell expansion, and npm runs scripts through `cmd.exe` on Windows, where
  it is passed through as the literal string `${PORT:-3000}` and the server
  fails to start. Relying on the env var is the cross-platform spelling.
- **`-H 0.0.0.0` binds all interfaces.** Next's default already binds all
  interfaces, but it is stated explicitly because a server bound to
  `127.0.0.1` is unreachable from the host's proxy and the symptom is a
  502 with nothing in the application log.

`PORT` cannot be set in a `.env` file — the HTTP server binds before any of
them are read.

## dependencies vs devDependencies

**GoDaddy runs `npm install --production`, so `devDependencies` are never
installed.** Anything needed to **build** or **run** the site must be in
`dependencies`, even when every other project in the world calls it a dev
tool:

- `tailwindcss`, `postcss`, `autoprefixer` — `postcss.config.js` requires all
  three by name at build time. Left in `devDependencies` the build fails with
  `Cannot find module 'tailwindcss'`; or worse, on a host that tolerates it,
  succeeds and serves the site with no CSS at all.
- `sharp` — `next/image` optimisation at runtime. Next declares it as an
  *optional* dependency, which is exactly why it is declared here
  *explicitly*: an optional dependency is skipped silently on any install
  that can't build it, and the failure surfaces later as unoptimised images.

`devDependencies` is for things that only ever run on a developer's machine —
`playwright` and test tooling. **Check this before adding any dependency:**
"would `npm install --omit=dev && npm run build` still pass?"

Prove it, don't assume it:

```bash
rm -rf node_modules
npm install --omit=dev
npm run build
PORT=4000 npm start
```

## Build-time environment variables

`NEXT_PUBLIC_*` values are **inlined into the browser bundle by `next build`**
— they are not read at runtime. GoDaddy loads environment variables "when
your app starts", which may be *after* the build, so setting them only in the
GoDaddy panel can produce a build that is already missing them: a site that
boots perfectly and has no pixel and a signup form that rejects every
submission, with nothing in the log to say so.

So the build refuses to run without them. `scripts/assert-build-env.js` is
called from `next.config.js` at `PHASE_PRODUCTION_BUILD` and throws:

- `NEXT_PUBLIC_META_PIXEL_ID` — **required**
- `NEXT_PUBLIC_WEB3FORMS_KEY` — **required**
- `NEXT_PUBLIC_GA_ID` — **optional**; empty means Google Analytics simply
  does not load. A reporting gap is not a broken site.

The intended fallback is a committed `.env.production` on this branch, so the
build carries its own values and does not depend on when the host injects
them. **Public, browser-visible values ONLY** — a `NEXT_PUBLIC_` value is in
the page source of every visitor's browser, so committing one leaks nothing.
A real secret (an API key with privileges, a payment gateway secret, a
database URL) must **never** go in it, and `.env.local` stays gitignored on
every branch.

Note that `.gitignore` lists `.env.production`, so committing it needs a
deliberate negation (`!.env.production`) on this branch — that friction is
the point, and the file must be read line by line before it is added. Until
then, pass the values in the environment at build time:
`NEXT_PUBLIC_META_PIXEL_ID=... NEXT_PUBLIC_WEB3FORMS_KEY=... npm run build`.

## Upload size and what ships

- **Under 100 MB**, excluding `node_modules/`, `.next/` and `.git/`. Tracked
  files are currently ~12 MB; the headroom is for `public/media/`.
- **Never upload `node_modules/`.** The host installs it. Uploading one built
  on Windows ships the wrong native binaries for `sharp` and Next's SWC.
- **Never upload `.next/`.** The host builds it.
- `screenshots/` is a local working folder, gitignored, and ~34 MB. It must
  stay untracked.

## Persistent files and app count

- **Writable, persistent files live in `public/assets/` only.** Anything the
  app writes anywhere else is on ephemeral storage and is lost on the next
  restart or redeploy. This site writes nothing today — it has no backend and
  no uploads — so this is a constraint on future work, not a current
  dependency.
- **One Node application per hosting plan.** There is no second process to
  put a worker, a cron job or a separate API in. Anything like that has to
  live inside this app (a route handler, `instrumentation.js`) or move off
  the host entirely — which is what Web3Forms already does for form delivery.

## Analytics, per host

`@vercel/analytics` only reports to the dashboard of a Vercel deployment, so
`app/layout.jsx` renders `<Analytics />` **only when `process.env.VERCEL` is
set** — a variable Vercel sets itself, read and never configured. Google
Analytics 4 (`components/GoogleAnalytics`) is the host-independent
replacement and runs in **every** place. Keep both — but note which one
carries the live site now: GA4 is the only analytics on Cloudflare Workers,
so **dropping GA would blind production**. The Vercel one reports only from
a Vercel deployment, which no longer serves the domain.

# Hosting: Cloudflare Workers (`cloudflare` branch)

**`cloudflare` is the branch that serves the live site**, via the official
OpenNext adapter (`@opennextjs/cloudflare`). The site must keep working on
**all three** — nothing here may be a Cloudflare-only hack that breaks the
Vercel deploy or the GoDaddy one. `npm run build` and `npm start` remain the
Vercel/Node entry points and are untouched by this section.

Cloudflare Workers is not a Node host. There is no long-lived process and no
filesystem, so `npm start` means nothing here: OpenNext compiles the Next
server into a single Worker script plus a directory of static assets.

`main` in `wrangler.jsonc` points at `custom-worker.js` — a committed
wrapper that imports the generated `.open-next/worker.js` and delegates
everything to it except the range-served video files. Nothing else is source:
the generated worker, the server bundle and the assets are all build output.

## The files, and what each one is for

- **`wrangler.jsonc`** — the Worker's own config: name, entry point,
  compatibility date and flags, bindings. Every field carries a comment
  saying why it is there; read it before changing any of them.
- **`custom-worker.js`** — the Worker entry point, and the only hand-written
  runtime code on this branch. It exists for one reason: answering `Range:`
  requests for the hero video with a real `206`. See **Range requests** below.
  It is invisible to the other two hosts — only `wrangler.jsonc` references
  it, and `wrangler.jsonc` exists only here.
- **`open-next.config.ts`** — the adapter's config. The filename is fixed by
  the CLI, which compiles it with esbuild, so it is TypeScript in a project
  with no `typescript` dependency. Next's TypeScript detection only scans
  `app/`, `pages/` and `src/`, so a root-level `.ts` file does **not** flip
  `next build` into TypeScript mode. Verified; re-verify if it ever moves.
- **`.env.production`** — committed, as on `godaddy`, for the same reason.
  See **Build-time environment variables** above.

`.open-next/` and `.wrangler/` are build output and local state. Both are
gitignored and neither is ever committed or uploaded by hand.

`npm run cf-typegen` writes `cloudflare-env.d.ts` — the binding types, and
~625 KB of generated workerd runtime types with them. It is **gitignored**,
not committed: nothing here consumes it (no TypeScript, no tsconfig), and
committed it would only re-churn on every wrangler bump. Run the script when
you want the types; delete the file when you don't.

## `nodejs_compat` is not optional

```jsonc
"compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"]
```

Next's server reaches for `node:stream`, `node:buffer`, `node:async_hooks`
and `node:crypto` on every render. Without `nodejs_compat` the Worker throws
at **import** time — before it serves a single request — so the symptom is
every route failing at once, not one slow page. The compatibility date must
also be `2024-09-23` or later, for the same reason. Do not "tidy" either
field.

## Build-time environment variables, again

Same rule as GoDaddy, same reason: `NEXT_PUBLIC_*` values are **inlined by
`next build`**, so they must exist when Cloudflare runs the build, not when
the Worker starts. `scripts/assert-build-env.js` runs inside the OpenNext
build — it calls `next build` internally, at `PHASE_PRODUCTION_BUILD` — and
still refuses a build missing `NEXT_PUBLIC_META_PIXEL_ID` or
`NEXT_PUBLIC_WEB3FORMS_KEY`.

The committed `.env.production` is what satisfies it, so a Workers build
needs **no environment variables configured in the Cloudflare dashboard at
all**. Setting them there too is harmless and makes them visible in the UI,
but a dashboard value is not a substitute: the file is the thing that cannot
be forgotten.

Workers **runtime** variables (`vars`, secrets) are useless for these three.
Nothing reads them at runtime; they are already baked into the bundle.

## Worker size: 64 MiB, not 3 MiB

**Since 2026-09-04 Cloudflare checks only the UNCOMPRESSED bundle size, and
the limit is 64 MiB on both the Free and Paid plans.** The old limits — 3 MiB
gzipped on Free, 10 MiB on Paid — are gone. Any guide or prior instruction
citing 3 MiB is out of date. Wrangler still prints a `gzip:` figure; it is
informational and no longer a limit.

Measured on this site:

```
Total Upload: 5342.68 KiB / gzip: 1119.17 KiB
```

That is ~5.2 MiB against a 64 MiB ceiling — about 8% — and also well under
the retired 3 MiB gzip rule. **The Free plan is sufficient; the $5 Workers
Paid plan buys nothing we need for size.** Nearly all of the 5.2 MiB is
Next's own compiled server runtime and React's server renderers.
`three`, `framer-motion`, `lucide-react` and `sharp` contribute nothing
measurable: they are client-side, or unused on this host.

Re-measure rather than guess:

```bash
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

## Large media must stay a static asset

`public/` is ~12 MB, most of it product photography and the hero video in
`public/media/iriz/video/`. OpenNext copies all of it, plus Next's
`/_next/static/**`, into `.open-next/assets/`, which is uploaded **beside**
the Worker and served from the edge:

- Those bytes do **not** count toward the Worker size limit.
- Requests that hit an asset do **not** invoke the Worker. On both plans they
  are free and unmetered, with no egress charge. The one exception is the two
  video files, deliberately routed through the Worker for byte ranges — see
  **Range requests** below. Their *bytes* still live in the assets, so the
  size rule above is unaffected.

So large media belongs in `public/`, exactly as it does today. It must never
be imported into a server component as data or inlined as a `data:` URI —
that moves it into the Worker bundle and bills every request for it.
Verified: no image or video bytes appear in the Worker bundle, and the files
served by the Workers runtime are byte-identical to the originals. The
per-file asset limit is 25 MiB, which the 723 KB video is nowhere near.

## next/image, and what it costs

`next/image` works unchanged — no loader file, no component edits. The
adapter implements Next's `/_next/image` endpoint on top of the Cloudflare
**Images binding** declared in `wrangler.jsonc`, which is the approach
OpenNext recommends. Verified in the Workers runtime: a 799 KB source PNG
comes back as 5.8 KB / 10.6 KB / 17.3 KB AVIF at widths 640 / 1080 / 1920,
honouring the `formats` and `qualities` already set in `next.config.js`.

**It is not unconditionally free.** Cloudflare bills *unique*
transformations: 5,000 per month free, then an Images Paid plan at $0.50 per
1,000. A unique transformation is one (source image x width x format x
quality) combination, cached for 30 days — it is **not** per request, so
traffic volume does not move the number. This site has roughly 20 optimised
images, which at Next's widths and the two configured formats is a few
hundred combinations a month: comfortably inside the free allowance.

What would break that is adding many images at once, or ever accepting
user-supplied image URLs. **If the allowance is exceeded, the free fallback
is to pre-generate the variants at build time** — `sharp` is already a
dependency — and serve them from `public/` via a custom loader. The crude
version is `images.unoptimized = true`, which ships the originals; several
detail PNGs are over 1 MB, so that is a last resort, not a plan. Do not
switch to `/cdn-cgi/image` as a "free" workaround: same product, same bill.

Unsupported by the Images binding, and unused here: `images.minimumCacheTTL`
and `dangerouslyAllowLocalIP`.

## Range requests: the hero video on iOS

**Confirmed on the live deployment, and fixed.** Workers Static Assets
answers a `Range:` request with **`200` and the whole file**, not `206
Partial Content`, and sends no `Accept-Ranges` header. It did this on
www.bluneuron.com for both `iriz-loop.mp4` and `iriz-loop.webm` — a 2-byte
range came back as all 739,869 bytes — so the earlier "only seen in the local
runtime, re-verify once live" note is settled: the local runtime was right.

Chrome and Firefox tolerate it and play the video. **iOS Safari requires
`206` for `<video>`** and shows the poster or a blank player instead.

The fix is `custom-worker.js`, reached through two `run_worker_first` rules in
`wrangler.jsonc`:

- `"run_worker_first": ["/media/*.mp4", "/media/*.webm"]` sends **only** those
  paths to the Worker ahead of the asset worker. The wildcard matches deep
  paths, so `/media/iriz/video/iriz-loop.mp4` is covered.
- The Worker reads the bytes back out of the `ASSETS` binding and slices
  them, so the videos are still ordinary static assets — uploaded beside the
  Worker, out of the Worker size budget, never inlined into the bundle.
- It answers `206` with `Content-Range`, `Accept-Ranges: bytes`, an explicit
  `Content-Type`, a 30-day `Cache-Control`, and the asset's own `ETag`
  passed through; `416` for an unsatisfiable range; and a plain `200` for a
  request with no `Range`, a multi-range header, or a non-matching
  `If-Range`.

Verified live, both files, cold and repeated:

```bash
curl -s -o /dev/null -D - -H "Range: bytes=0-1" \
  https://www.bluneuron.com/media/iriz/video/iriz-loop.mp4 | head -5
# HTTP/1.1 206 Partial Content
# Content-Range: bytes 0-1/739869
# Accept-Ranges: bytes
```

Two consequences worth knowing before touching any of it:

- **Those two paths are now billed Worker invocations**, not free asset
  hits, and `CF-Cache-Status` disappears from their responses — the Worker
  runs ahead of the cache. That is a fine trade for two files and would not
  be fine for all of `public/`, so **keep the `run_worker_first` list
  narrow**. Everything else under `/media/` (the poster frame, the product
  photography) still comes straight off the edge, free and `HIT`.
- The Worker buffers the whole file to slice it. Bounded by Cloudflare's
  25 MiB per-asset limit, and these are 723 KB and 651 KB. A genuinely large
  video would need streaming instead.

`components/HeroBackdrop` still treats poster-only as a supported state, so
the page degrades rather than breaks if this ever regresses.

## No ISR, deliberately

`open-next.config.ts` uses `staticAssetsIncrementalCache` — the free,
read-only cache that reads prerendered pages out of the uploaded assets. It
needs no R2 bucket, no KV namespace, no queue and no `WORKER_SELF_REFERENCE`
service binding.

The cost of that choice: **`revalidate`, `revalidatePath` and on-demand
revalidation do not work.** Every route is prerendered at build time except
`/`, which reads `searchParams` for the `?hero=` override and is plain SSR,
so nothing today needs them. If ISR is ever added it will fail *silently* —
the page will serve its build-time copy forever. Switch to
`r2IncrementalCache`, add the bucket and the queue, and read
https://opennext.js.org/cloudflare/caching first.

## Wrangler needs Node 22

`wrangler` declares `node >= 22` and refuses to start on Node 20 with
`Wrangler requires at least Node.js v22.0.0`. `package.json` still allows
`>=20.9 <23` because the Next build itself is fine on 20 — so `npm run build`
works on Node 20 while `npm run preview` and `npm run deploy` do not. Use
Node 22 locally for anything that touches wrangler.

**`.node-version` pins the hosted build to Node 22**, and it is there because
the two ends disagree: Cloudflare's build image defaults to **Node 24**,
which is outside this project's declared `engines` range (`>=20.9 <23`),
while wrangler's floor is 22. Twenty-two is the only version that satisfies
both, and the Workers build image preinstalls it, so the pin costs no build
time. Without the file the build still runs — `.npmrc` sets no
`engine-strict`, so a version outside `engines` is a warning, not an error —
but it would run on a Node this project does not claim to support. Vercel
reads the same file; GoDaddy ignores it and picks its Node in the panel.

## What this costs the GoDaddy install

`@opennextjs/cloudflare` is a `dependency`, per the rule above: anything a
build needs must survive `npm install --omit=dev`. `wrangler` is a
`devDependency` — but it lands in the production install anyway, because it
is a **peer dependency of `@opennextjs/cloudflare`** and npm installs peers
by default. Measured on this branch, `npm install --omit=dev` goes from
**170 packages to 465**.

That is noise, not a problem, and specifically it does NOT touch the 100 MB
upload rule: `node_modules/` is never uploaded, the host installs it. Proven
on this branch, in a clean tree with no `.env.local`:

```bash
npm install --omit=dev   # 465 packages
npm run build            # passes; all 15 routes
```

If that install ever needs to be lean again, moving
`@opennextjs/cloudflare` to `devDependencies` is safe **for Cloudflare**,
which installs dev dependencies during a build — but it would then be
missing on any host that does not, so do not make that change without
re-reading **dependencies vs devDependencies** above.

## Connecting the branch (Workers Builds)

Workers & Pages -> Create -> Workers -> Import a repository, pick this repo,
and set:

- **Git branch**: `cloudflare`
- **Build command**: `npx opennextjs-cloudflare build`
- **Deploy command**: `npx wrangler deploy`
- **Build variables**: none required; `.env.production` is committed.

Never point Workers Builds at `main` or `godaddy`. Neither has
`wrangler.jsonc`, and the deploy step would fail — or worse, deploy
something that was never built for this runtime.
