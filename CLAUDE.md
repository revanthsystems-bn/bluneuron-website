@AGENTS.md

# Working rules

- **Work on feature branches.** Never commit directly to `main`.
- **Never push to `main` without an explicit "ship to main".** Merging into
  `main` deploys to the live site via Vercel; that is a decision, not a step.
- **Never force-push.** Any branch, any time.
- **Never commit `.env.local`**, or any file holding a real secret.
  `.env.example` is committed and holds variable NAMES only.
- **Never commit the launch video** (`Launch video  2.mov`, ~65 MB). It is
  not tracked and must stay that way — it would push the repo past the
  100 MB upload limit GoDaddy enforces. Large media belongs in
  `public/media/` only when it is genuinely needed by a page, and compressed
  (see the existing `iriz-loop.mp4` / `.webm` pair at under 1 MB each).

# Hosting: GoDaddy Node.js (`godaddy` branch)

The live site runs on **Vercel from `main`**. The `godaddy` branch is the
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
replacement and runs in both places. Keep both: dropping the Vercel one would
blind the live site, and dropping GA would blind the GoDaddy one.
