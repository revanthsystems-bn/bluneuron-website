# Supabase setup — accounts, OTP email, and the keys to hand over

Everything here is done **by you, in dashboards**. Nothing in this file needs
a code change, and nothing in it should ever be committed.

The site works without any of it: with no Supabase keys the account area runs
in **demo mode** — `/sign-in` accepts any six-digit code, the account pages
show clearly-labelled fixture data, and a banner says so on every one. That is
the state the current preview is in. `npm run check:production` refuses a
production deploy while demo mode is on.

---

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**.
2. Organisation: yours. Name: `bluneuron`.
3. **Region: `ap-south-1` (Mumbai)** — your customers are in India, and the
   round trip to a US region is ~250 ms on every query.
4. Set a database password and store it in your password manager. You will
   not need it for this site; it is for direct `psql` access.
5. Wait for provisioning (~2 minutes).

---

## 2. Run the migration

1. Dashboard → **SQL Editor** → **New query**.
2. Paste the whole of **`supabase/migrations/0001_accounts.sql`** and **Run**.
3. The last statement prints a table. Every row must read:

   | table_name | rls_enabled | policy_count |
   |---|---|---|
   | addresses | `true` | 4 |
   | profiles | `true` | 4 |
   | registered_products | `true` | 4 |
   | warranty_claims | `true` | 4 |

   `rls_enabled = false` on any row means that table is readable by anyone
   with the publishable key. Do not continue past it.

### Prove the policies work

1. SQL Editor → **New query** → paste **`supabase/rls-tests.sql`** → **Run**.
2. Expect **17 rows, all `PASS`**. It creates two users, has one try to read,
   change, delete and file claims against the other's rows, and rolls the
   whole thing back — it leaves nothing behind.
3. These tests were run against PostgreSQL 16 before being handed to you and
   all 17 passed; running them again on your project is what proves *your*
   database, not the design.

Any `FAIL` is a real hole. Stop and tell me which one.

---

## 3. Switch sign-in to a 6-digit code

By default Supabase emails a **magic link**, not a code. The site asks for a
code, so this has to change or the email will carry a link nobody can type in.

1. **Authentication → Providers → Email**:
   - **Enable email provider**: on.
   - **Confirm email**: on.
   - **Secure email change**: on.
   - **Enable email OTP**: on. If you see a separate "Magic Link" toggle,
     turn it **off** — one route, not two.
   - **OTP expiry**: `3600` seconds (1 hour) or less. Shorter is safer;
     anything under ~10 minutes starts failing people who switch apps.
   - **OTP length**: `6`.
2. **Authentication → Providers**: leave **Google disabled**. Sign-in is email
   OTP only, by your instruction, and there is no Google code left in the app.
3. **Authentication → URL Configuration → Site URL**:
   `https://www.bluneuron.com`.
   Add your preview URL under **Redirect URLs** if you want to test a signed-in
   session on a preview build.

---

## 4. Send the OTP from support@bluneuron.com (custom SMTP)

Supabase's built-in email sender is rate-limited to a handful of messages an
hour and sends from *their* domain. For real customers you need your own.

### 4a. Create a Google Workspace app password

An app password, not your account password — Workspace will reject a plain
password over SMTP when 2-Step Verification is on.

1. Sign in to Google as **support@bluneuron.com**.
2. **2-Step Verification must be ON** for that account
   (<https://myaccount.google.com/security>). App passwords do not exist
   without it.
3. Go to <https://myaccount.google.com/apppasswords>.
4. App name: `Supabase SMTP`. **Create**.
5. Copy the 16-character password. Google shows it once. Store it in your
   password manager.

> If `/apppasswords` says it is unavailable, your Workspace admin has disabled
> "Less secure app access"/app passwords for the org. In Admin Console →
> **Security → Access and data control → Less secure apps**, allow app
> passwords for this user, or use a Workspace "SMTP relay" instead.

### 4b. Point Supabase at Gmail

**Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:

| Field | Value |
|---|---|
| Sender email | `support@bluneuron.com` |
| Sender name | `BluNeuron` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `support@bluneuron.com` |
| Password | the 16-character app password |
| Minimum interval between emails | `60` seconds |

Port **587** (STARTTLS), not 465 — Supabase's sender expects STARTTLS on 587.

**Save**, then **Authentication → Users → Invite user** to yourself as a live
test. The message must arrive from `support@bluneuron.com`.

### 4c. Gmail's sending limits are the real constraint

Google Workspace allows roughly **2,000 messages per day** per user, and SMTP
relay is throttled per minute. That is far beyond a warranty-registration
flow, but it is a *hard* ceiling: if sign-ins ever spike past it, Google starts
rejecting and Supabase surfaces it as a failed sign-in with no detail. If that
day comes, move to a transactional sender (Resend, SES) — the SMTP fields above
are the only thing that changes.

### 4d. SPF and DKIM

You already have both in Cloudflare DNS for Google Workspace. Nothing to add:
mail is being *sent by Gmail as support@bluneuron.com*, which is exactly what
your existing records authorise. Confirm once with:

```bash
dig +short TXT bluneuron.com | grep spf
dig +short TXT google._domainkey.bluneuron.com
```

The SPF record must include `include:_spf.google.com`. If you later switch away
from Gmail to another sender, **that** is when SPF/DKIM need changing.

---

## 5. Brand the OTP email

**Authentication → Emails → Templates → Magic Link** (this template is what the
OTP flow uses; `{{ .Token }}` is the six-digit code).

- **Subject**: `Your BluNeuron sign-in code`
- **Message body**: paste the contents of
  **`docs/email-templates/otp-email.html`** from this repository.

The template is dark, uses the BluNeuron wordmark, prints the code large and
monospaced, and says it expires. It deliberately contains **no link** — the
site asks for a typed code, and an email offering both trains people to click
the thing we did not build.

Send yourself a test afterwards. Dark-mode email clients vary wildly; the
template uses table layout and inline styles for that reason.

---

## 6. Give me the two values

Once the project exists:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both are **browser values** — they ship in the page source, and Row Level
Security is what protects the data, not their secrecy. They are kept out of git
anyway so that rotating the key is a dashboard action and a rebuild rather than
a commit and a history rewrite.

**Do not send me the `service_role` key.** Nothing in this application uses it,
and it bypasses RLS entirely. If a future server-only job needs it, you add it
yourself with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`.

### Where they go at build time

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
set -a; . ./.env.production; set +a
npx opennextjs-cloudflare build
```

For production you will want them permanent. Two options:

1. **Append them to `.env.production`** (committed on this branch, same as the
   Pixel ID and Web3Forms key). Simplest, and the file already holds only
   browser-visible values — but the key then lives in git history.
2. **Set them in the Cloudflare Workers Builds environment** if you ever
   connect the repo, or export them in whatever shell runs the deploy.

I have left this to you deliberately. Option 1 is the one this project already
uses for every other `NEXT_PUBLIC_` value.

---

## 7. What is deliberately NOT set up

- **Resend.** The original plan named it; Gmail via Workspace is simpler, you
  already own the domain and mailbox, and it needs no new DNS. Swap later by
  changing only the SMTP fields in 4b.
- **Row-level rate limiting on OTP requests.** Supabase enforces its own
  per-email interval (the "minimum interval" field above). Nothing further is
  needed at this volume.
- **A `service_role` server route.** None exists, by design.
- **Deleting the auth user on "delete my account".** The browser can delete
  every row the person owns — profile, addresses, products, claims — and does.
  Removing the `auth.users` row itself needs the service role key, so the
  account page tells the person to email `support@bluneuron.com` and you do it
  from **Authentication → Users**. That residual record is an email address and
  a user id, nothing more.
