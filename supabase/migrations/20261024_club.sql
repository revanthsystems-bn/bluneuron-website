-- =====================================================================
-- THE IRIZ CLUB — serials, members, rate limiting, and the three functions
-- the Worker is allowed to call.
--
-- HOW TO RUN: paste this whole file into the Supabase SQL Editor and run it
-- once. It is idempotent (`if not exists` / `create or replace` / `drop
-- policy if exists`), so running it again is safe. Step-by-step instructions,
-- including the server key and the CSV import, are in docs/club-setup.md.
--
-- =====================================================================
-- THE SECURITY MODEL, in one paragraph
-- =====================================================================
-- The browser holds the Supabase publishable (anon) key, which is PUBLIC by
-- design — it is inlined into the page source of every visitor's browser.
-- So anon is granted NOTHING here: RLS is enabled on all four tables and not
-- one of them carries a policy for anon, which means every direct select,
-- insert, update and delete returns zero rows or an error. The only way in is
-- the three SECURITY DEFINER functions at the bottom, and each of those
-- demands `p_server_key` — a value held in `club_config`, a table anon also
-- cannot read. That key lives only in the Cloudflare Worker's secrets. The
-- practical effect: the Club is reachable through our own route handlers,
-- where the body cap, the same-origin check, the check-letter validation and
-- the rate limit all run first, and through nothing else.
--
-- WHY SECURITY DEFINER IS SAFE HERE. Each function does one narrow thing,
-- takes only scalar arguments, never interpolates them into SQL text, and
-- sets an empty `search_path` so nothing can be shadowed by a schema an
-- attacker controls. They are not general query gateways.
--
-- THE service_role KEY IS NOT USED BY ANY OF THIS, and must never be. It
-- bypasses RLS entirely, it does not appear in this repository, and nothing
-- the application does needs it.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. club_config — the shared secret, and nothing else.
-- ---------------------------------------------------------------------
-- A one-row table rather than a Vault entry, deliberately: Vault needs the
-- `supabase_vault` extension and a different access pattern, and the thing
-- being stored is a single comparison value, not a credential that decrypts
-- anything. RLS is on with no policies at all, so anon cannot read it even
-- though the functions below can (they run as the definer).
create table if not exists public.club_config (
  key   text primary key,
  value text not null
);

alter table public.club_config enable row level security;
revoke all on public.club_config from anon, authenticated;


-- ---------------------------------------------------------------------
-- 2. club_serials — the manufacturing run. The real gate.
-- ---------------------------------------------------------------------
-- A serial is a member of this table or it is not a key to anything. The
-- check letter in lib/club-serial.js only decides whether a string is worth
-- looking up here.
--
-- `serial` is the primary key and is stored UPPER CASE without spaces or
-- dashes, which is exactly what lib/club-serial.js `parseSerial` produces.
-- A lowercase row would be a second, unreachable serial.
create table if not exists public.club_serials (
  serial      text primary key,
  product     text,
  batch       text,
  imported_at timestamptz not null default now()
);

alter table public.club_serials enable row level security;
revoke all on public.club_serials from anon, authenticated;


-- ---------------------------------------------------------------------
-- 3. club_members — one row per member, one member per serial.
-- ---------------------------------------------------------------------
-- `member_no` is the human-facing number printed on the member card. It is a
-- plain sequence, so #0001 is the first person who joined. It is NOT a
-- secret and NOT a capability: the cookie carries it, and it is only accepted
-- because the cookie's HMAC verifies.
--
-- `serial` is UNIQUE and references club_serials, which is what "one serial,
-- one member" means at the level that cannot be raced: two simultaneous
-- claims on the same serial, the second one loses on the unique index rather
-- than on a check the application performed a moment earlier.
create table if not exists public.club_members (
  id         uuid primary key default gen_random_uuid(),
  member_no  serial unique,
  serial     text not null unique references public.club_serials (serial),
  name       text not null,
  email      text not null,
  phone      text,
  city       text,
  consent_at timestamptz,
  joined_at  timestamptz not null default now(),
  status     text not null default 'active'
);

-- Sign-in matches on serial + email, case-insensitively on the email: people
-- do not remember whether they typed a capital. The index makes that lookup
-- an index scan rather than a sequential one as the table grows.
create index if not exists club_members_email_lower_idx
  on public.club_members (lower(email));

alter table public.club_members enable row level security;
revoke all on public.club_members from anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. club_attempts — rate limiting, and NO personal data.
-- ---------------------------------------------------------------------
-- `key_hash` is a salted SHA-256 of the caller's IP, computed in the Worker
-- (see rateLimitKey in lib/club-server.js). The raw address never arrives
-- here. The salt is the server key, so the hashes are not reversible by
-- anyone who obtains this table.
--
-- Only FAILED attempts are recorded. A successful join or sign-in writes
-- nothing, so a family sharing one connection does not lock itself out by
-- succeeding.
create table if not exists public.club_attempts (
  id         bigserial primary key,
  key_hash   text not null,
  created_at timestamptz not null default now()
);

create index if not exists club_attempts_key_time_idx
  on public.club_attempts (key_hash, created_at desc);

alter table public.club_attempts enable row level security;
revoke all on public.club_attempts from anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. The guard every function opens with.
-- ---------------------------------------------------------------------
-- Compared with `=` on a value nobody can read without already having it.
-- A timing-safe comparison would be better in principle; in practice the
-- attacker here is remote, the key is 64 random characters, and the network
-- jitter on a Supabase round trip is orders of magnitude larger than the
-- difference a string compare would leak.
create or replace function public.club_key_ok(p_server_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_config
    where key = 'server_key'
      and value = coalesce(p_server_key, '')
      and value <> ''
  );
$$;


-- ---------------------------------------------------------------------
-- 6. The rate limiter.
-- ---------------------------------------------------------------------
-- Five FAILED attempts per key_hash per hour. Counted inside the functions
-- rather than in the Worker on purpose: a Worker is stateless and there may
-- be many isolates, so an in-memory counter there would reset constantly and
-- count only a fraction of the traffic.
--
-- Rows older than a day are deleted opportunistically on each check. That
-- keeps the table from growing without a scheduled job, which this project
-- has nowhere to run (see "One Node application per hosting plan" in
-- CLAUDE.md — the same constraint applies to cron here).
create or replace function public.club_rate_limited(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  if p_key_hash is null or p_key_hash = '' then
    return true;      -- no key means no limit is possible: refuse, do not allow
  end if;

  delete from public.club_attempts where created_at < now() - interval '1 day';

  select count(*) into recent
  from public.club_attempts
  where key_hash = p_key_hash
    and created_at > now() - interval '1 hour';

  return recent >= 5;
end;
$$;


-- ---------------------------------------------------------------------
-- 7. club_claim — join the Club.
-- ---------------------------------------------------------------------
-- Returns jsonb: {"member_no": 1} on success, or {"code": "..."} where code
-- is INVALID, NOT_FOUND, ALREADY_CLAIMED or RATE_LIMITED.
--
-- NOT_FOUND AND INVALID ARE SEPARATE HERE AND IDENTICAL AT THE ROUTE. The
-- function tells the truth so the Worker's logs can distinguish a typo from
-- a guess; `clubErrorMessage` in lib/club-server.js then renders both with
-- one message, so the form cannot be used to enumerate which serials exist.
--
-- THE CHECK LETTER IS VALIDATED AGAIN, IN SQL. It is already checked in the
-- browser and again in the route handler, and it is checked a third time here
-- because this function is the last thing between a caller and the table —
-- and the first two run in code that a future refactor could route around.
create or replace function public.club_claim(
  p_server_key text,
  p_serial     text,
  p_name       text,
  p_email      text,
  p_phone      text,
  p_city       text,
  p_consent    boolean,
  p_key_hash   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_serial  text;
  v_exists  boolean;
  v_taken   boolean;
  v_member  integer;
  full_a    constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  chk_a     constant text := 'ABCDEFGHJKLMNPRSTUVWXYZ';
  v_sum     integer := 0;
  v_pos     integer;
begin
  if not public.club_key_ok(p_server_key) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if public.club_rate_limited(p_key_hash) then
    return jsonb_build_object('code', 'RATE_LIMITED');
  end if;

  -- Consent is required. The form cannot be submitted without it, and this
  -- is the server-side half of that: a record written without consent is a
  -- record we had no basis to keep.
  if p_consent is not true then
    return jsonb_build_object('code', 'INVALID');
  end if;

  v_serial := upper(regexp_replace(coalesce(p_serial, ''), '[[:space:]-]', '', 'g'));

  if length(v_serial) <> 11 then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'INVALID');
  end if;

  -- The check letter: sum((i) * value) % 23, with i running 1..10 — the same
  -- weights as checkLetter() in lib/club-serial.js, where the loop index
  -- starts at 0 and the weight is i+1. Postgres strings are 1-indexed, so
  -- `i` here IS the weight.
  for i in 1..10 loop
    v_pos := position(substr(v_serial, i, 1) in full_a);
    if v_pos = 0 then
      insert into public.club_attempts (key_hash) values (p_key_hash);
      return jsonb_build_object('code', 'INVALID');
    end if;
    v_sum := v_sum + i * (v_pos - 1);
  end loop;

  if substr(v_serial, 11, 1) <> substr(chk_a, (v_sum % 23) + 1, 1) then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'INVALID');
  end if;

  -- NO ATTEMPT IS RECORDED for the two checks below, unlike every serial
  -- check above them. A blank name or a malformed email is a form error made
  -- by someone who already holds a valid serial; feeding those to the rate
  -- limiter would lock a real owner out for an hour over a typo in their own
  -- email. Only serial-shaped failures count towards the limit, because only
  -- those are what an enumeration attempt looks like.
  if p_name is null or btrim(p_name) = '' or length(p_name) > 60 then
    return jsonb_build_object('code', 'INVALID');
  end if;
  if p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(p_email) > 160 then
    return jsonb_build_object('code', 'INVALID');
  end if;

  select true into v_exists from public.club_serials where serial = v_serial;
  if v_exists is not true then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'NOT_FOUND');
  end if;

  select true into v_taken from public.club_members where serial = v_serial;
  if v_taken is true then
    return jsonb_build_object('code', 'ALREADY_CLAIMED');
  end if;

  -- The unique index on `serial` is what actually makes this one-member-per-
  -- serial: the check above narrows the common case, this catches the race.
  begin
    insert into public.club_members (serial, name, email, phone, city, consent_at)
    values (
      v_serial,
      btrim(p_name),
      btrim(p_email),
      nullif(btrim(coalesce(p_phone, '')), ''),
      nullif(btrim(coalesce(p_city, '')), ''),
      now()
    )
    returning member_no into v_member;
  exception when unique_violation then
    return jsonb_build_object('code', 'ALREADY_CLAIMED');
  end;

  return jsonb_build_object('member_no', v_member);
end;
$$;


-- ---------------------------------------------------------------------
-- 8. club_signin — the same member, a second device.
-- ---------------------------------------------------------------------
-- Serial plus the email used to join. There is no password and no OTP
-- because there is no transactional email set up on this project, and
-- inventing a password for a page that shows a member number and some links
-- would be security theatre with a support cost.
--
-- WHAT THIS IS WORTH, stated honestly: someone who holds a box AND knows the
-- owner's email can sign in as them. What they get is a first name, a member
-- number and a join date. No address, no order, no payment method, nothing to
-- change. The threat is proportionate to the asset.
--
-- Email is matched case-insensitively; serial exactly, after normalisation.
create or replace function public.club_signin(
  p_server_key text,
  p_serial     text,
  p_email      text,
  p_key_hash   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_serial text;
  v_member integer;
begin
  if not public.club_key_ok(p_server_key) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if public.club_rate_limited(p_key_hash) then
    return jsonb_build_object('code', 'RATE_LIMITED');
  end if;

  v_serial := upper(regexp_replace(coalesce(p_serial, ''), '[[:space:]-]', '', 'g'));

  select member_no into v_member
  from public.club_members
  where serial = v_serial
    and lower(email) = lower(btrim(coalesce(p_email, '')))
    and status = 'active';

  if v_member is null then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'NOT_FOUND');
  end if;

  return jsonb_build_object('member_no', v_member);
end;
$$;


-- ---------------------------------------------------------------------
-- 9. club_member — the minimal profile behind a valid cookie.
-- ---------------------------------------------------------------------
-- FIRST NAME ONLY, the member number, and the join date. Not the email, not
-- the phone, not the city, not the serial. The member card needs a greeting
-- and a number; everything else in the row would be data travelling to a
-- browser for no reason, and a function that returns a whole row is a
-- function someone will later call from somewhere it should not be.
--
-- `split_part(name, ' ', 1)` because the form asks for a first name but
-- people type their full one.
--
-- NO RATE LIMIT on this one: it is reached only with a cookie this server
-- signed, so there is nothing to guess. It takes no key_hash for that reason.
create or replace function public.club_member(
  p_server_key text,
  p_member_no  integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  if not public.club_key_ok(p_server_key) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select member_no, split_part(btrim(name), ' ', 1) as first_name, joined_at
    into v_row
  from public.club_members
  where member_no = p_member_no
    and status = 'active';

  -- `found`, not `v_row is null`. A record variable tests as null only when
  -- EVERY field is null, so a member whose row somehow held nulls would read
  -- as "no such member" rather than as a data problem. `found` answers the
  -- question actually being asked: did the select return a row.
  if not found then
    return jsonb_build_object('code', 'NOT_FOUND');
  end if;

  return jsonb_build_object(
    'member_no',  v_row.member_no,
    'first_name', v_row.first_name,
    'joined_at',  v_row.joined_at
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 10. Grants. EXECUTE only, and only on the three entry points.
-- ---------------------------------------------------------------------
-- `club_key_ok` and `club_rate_limited` are helpers and are NOT granted:
-- anon has no reason to ask whether a key is right, and being able to ask
-- would turn the key into something brute-forceable.
--
-- Granting EXECUTE to anon is what makes the functions reachable with the
-- public key at all; `p_server_key` is what makes that safe. Both halves are
-- required — remove the grant and the Worker cannot call them either.
revoke all on function public.club_key_ok(text) from anon, authenticated;
revoke all on function public.club_rate_limited(text) from anon, authenticated;

grant execute on function public.club_claim(text, text, text, text, text, text, boolean, text)
  to anon;
grant execute on function public.club_signin(text, text, text, text) to anon;
grant execute on function public.club_member(text, integer) to anon;


-- ---------------------------------------------------------------------
-- 11. SET THE SERVER KEY. Do this yourself; do not commit the value.
-- ---------------------------------------------------------------------
-- Generate one (64 hex characters) and run the statement below with it, in
-- the SQL Editor, as a separate step. The SAME value goes into the Worker as
-- the CLUB_SERVER_KEY secret.
--
--   insert into public.club_config (key, value)
--   values ('server_key', 'PASTE_THE_64_CHAR_VALUE_HERE')
--   on conflict (key) do update set value = excluded.value;
--
-- To rotate it later: run that statement with a new value, then
-- `wrangler secret put CLUB_SERVER_KEY`. Do both within a minute of each
-- other — between them, every join and sign-in returns "not available".
-- Nobody is signed out by a rotation: existing cookies are verified against
-- CLUB_COOKIE_SECRET, which is a different secret.
