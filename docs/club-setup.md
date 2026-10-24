# IRIZ Club — setup

Everything here is done **by you**, not by the codebase. Two of the steps
involve secrets; those values must never be pasted into a file in this
repository, into a commit message, or into a chat.

There are four steps and they must happen in this order. Until all four are
done, `/club` renders an honest "The Club is not open yet" panel instead of a
form — it does not error, and it does not offer a form that fails on submit.

---

## What you will need

- Access to the Supabase project (the same one in `.env.production` —
  `NEXT_PUBLIC_SUPABASE_URL`).
- `wrangler` on a machine with Node 22 (see CLAUDE.md), logged in to the
  Cloudflare account that owns `bluneuron-website`.
- Your `serials.csv`, with the columns `serial,product,year,month,batch,unit`.

---

## Step 1 — Run the migration

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the whole of `supabase/migrations/20261024_club.sql`.
3. **Run**.

It creates four tables (`club_config`, `club_serials`, `club_members`,
`club_attempts`), three functions anon may call (`club_claim`, `club_signin`,
`club_member`), two it may not, and the grants. Row Level Security is enabled
on every table with **no policies**, so the public anon key cannot read or
write any of them directly.

It is idempotent — running it twice is safe.

**Check it worked:** Table Editor should list the four `club_` tables, and
each should show a green **RLS enabled** badge.

---

## Step 2 — Generate and set the server key

This is the value that stops anyone with the public anon key from calling
`club_claim` themselves. It goes in **two places** and they must match.

Generate 64 hex characters. Any of these:

```bash
# macOS / Linux / Git Bash
openssl rand -hex 32

# PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2a. Into Supabase.** SQL Editor → New query → run, with your value:

```sql
insert into public.club_config (key, value)
values ('server_key', 'PASTE_YOUR_64_CHARACTER_VALUE_HERE')
on conflict (key) do update set value = excluded.value;
```

**2b. Into the Worker.** From the repo root, on the branch you are deploying:

```bash
export PATH="/c/Users/MEENA/AppData/Local/node22/node-v22.23.3-win-x64:$PATH"
npx wrangler secret put CLUB_SERVER_KEY
```

Paste the **same** value at the prompt.

---

## Step 3 — Set the cookie secret

A different secret, for a different job: it signs the membership cookie. It
goes **only** into the Worker — nothing in Supabase needs it.

```bash
npx wrangler secret put CLUB_COOKIE_SECRET
```

Paste another 64 hex characters (generate a **new** one — do not reuse the
server key).

Must be at least 32 characters. A shorter one is refused at runtime and the
Club reports itself as unavailable rather than signing cookies weakly.

---

## The two secret names, exactly

| Name | Where | What it does |
|---|---|---|
| `CLUB_SERVER_KEY` | Worker secret **and** `club_config.server_key` | Proves a call to the database functions came from our Worker. Also salts the IP hash used for rate limiting. |
| `CLUB_COOKIE_SECRET` | Worker secret only | HMAC key for the member cookie. At least 32 characters. |

Set them with `wrangler secret put <NAME>`, or in the Cloudflare dashboard
under the Worker → Settings → Variables and Secrets → **Secret** type (not
Text). Never `NEXT_PUBLIC_`, never in `.env.production`, never committed.

**Secrets are per-Worker, not per-version.** Setting them applies to the
deployed Worker and to every preview version of it, so a preview can be
tested before anything goes live.

---

## Step 4 — Import serials.csv

**Before you import, check the file.** A serial whose check letter is wrong
can be imported and then never claimed, because the website will reject it at
the form before it ever reaches the database:

```bash
node scripts/test-club-serial.mjs path/to/serials.csv
```

That reports any row that fails the check letter, and any duplicate. Both must
be zero. If rows fail, the label script and `lib/club-serial.js` have drifted —
fix that first; do not import.

Then:

1. Supabase dashboard → **Table Editor** → `club_serials`.
2. **Insert** → **Import data from CSV**.
3. Upload `serials.csv`.
4. Map the columns:

   | CSV column | → | `club_serials` |
   |---|---|---|
   | `serial` | → | `serial` |
   | `product` | → | `product` |
   | `batch` | → | `batch` |
   | `year` | → | *(leave unmapped)* |
   | `month` | → | *(leave unmapped)* |
   | `unit` | → | *(leave unmapped)* |

   `year`, `month` and `unit` are already encoded inside the serial itself, so
   there is nothing for them to add and no column for them. `imported_at`
   fills itself in.

5. Import.

**Serials must be upper case with no spaces or dashes** — `IRZT6XA001D`, not
`irz-t6x-a001-d`. `serial` is the primary key, so a lowercase row is a second,
unreachable serial. If your export is lower case, fix it before importing, or
afterwards with:

```sql
update public.club_serials
set serial = upper(regexp_replace(serial, '[[:space:]-]', '', 'g'))
where serial <> upper(regexp_replace(serial, '[[:space:]-]', '', 'g'));
```

**Check it worked:**

```sql
select count(*) from public.club_serials;
```

---

## Adding a later batch

Repeat step 4 only. `serial` is the primary key, so re-importing a file that
overlaps an earlier one fails on the duplicates rather than creating them —
import only the new rows, or use the dashboard's upsert option.

---

## Day-to-day queries

```sql
-- How many members, and the most recent few.
select member_no, split_part(name, ' ', 1) as first_name, city, joined_at
from public.club_members
order by member_no desc
limit 20;

-- How many serials are claimed.
select
  (select count(*) from public.club_serials) as imported,
  (select count(*) from public.club_members) as claimed;

-- Someone asked to leave the Club. This deletes their details and RELEASES
-- the serial, so a future owner of that unit could join with it.
delete from public.club_members where member_no = 42;
```

Leaving the Club does **not** touch a warranty registration — those live in
the Google Sheet and are a separate record. `/legal/privacy` says so, and a
customer asking to "delete my data" has to be asked which they mean.

---

## Rotating a secret

**Cookie secret.** `wrangler secret put CLUB_COOKIE_SECRET` with a new value.
Every member is signed out on their next page load and signs in again with
serial + email. This is the lever to pull if a secret is ever exposed.

**Server key.** Run the `insert … on conflict` from step 2a with the new
value, then `wrangler secret put CLUB_SERVER_KEY` with the same one. Do both
within a minute: between them, joins and sign-ins answer "not available".
Nobody is signed out — cookies are verified against the other secret.

---

## If something is wrong

| Symptom | Cause |
|---|---|
| `/club` shows "The Club is not open yet" | One of the two Worker secrets is missing, or the Supabase values are absent from the build. |
| Every join says "could not match that serial number" | `club_serials` is empty, or the serials were imported lower case. |
| Every join says "not available right now" | The server key in `club_config` and the Worker secret do not match, or the migration has not been run. |
| A member is signed out unexpectedly | `CLUB_COOKIE_SECRET` changed, or the 90 days elapsed. |
| "Too many attempts" during testing | The rate limit: five failed attempts per IP per hour. Clear it with `delete from public.club_attempts;`. |

---

## What is deliberately not here

- **No `service_role` key.** Nothing in the Club uses it, and it must never be
  added. It bypasses Row Level Security entirely.
- **No email sending.** There is no transactional email on this project, which
  is why sign-in is serial + email rather than a password or an emailed code.
  See the note in `supabase/migrations/20261024_club.sql`.
- **No `serials.csv` in this repository.** It is the full list of keys to the
  Club. Keep it where you keep the label script.
