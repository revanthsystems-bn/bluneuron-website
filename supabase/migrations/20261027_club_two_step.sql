-- =====================================================================
-- THE IRIZ CLUB, STEP ONE — club_check_serial, and a phone number that is
-- no longer optional.
--
-- HOW TO RUN: paste this whole file into the Supabase SQL Editor and run it
-- once, AFTER supabase/migrations/20261024_club.sql. It is idempotent
-- (`create or replace`, and the constraint is added only if it is missing),
-- so running it again is safe.
--
-- ---------------------------------------------------------------------
-- WHY: joining is now TWO STEPS.
-- ---------------------------------------------------------------------
-- The door used to ask for the serial and six personal details in one
-- form, which is a lot of typing to do before finding out the serial is
-- wrong. It now asks for the serial on its own, answers in one word, and
-- only then asks who you are.
--
-- That first answer is `club_check_serial`. It is a NEW entry point and the
-- fourth function anon may execute, so it is held to exactly the same rules
-- as the other three: the server key, the rate limiter, and an answer that
-- cannot be used to enumerate which serials exist.
--
-- STEP ONE IS NOT A GATE. `club_claim` re-checks everything — the check
-- letter, the serial's existence, whether it is already claimed — because
-- step one's answer travels through a browser and a browser can be skipped
-- entirely by posting to /api/club/join directly. Step one exists to tell a
-- customer sooner, not to let the join trust anything.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. club_members.phone is required for NEW members.
-- ---------------------------------------------------------------------
-- The two-step form asks for a mobile number and will not submit without
-- one: a Club member we cannot reach when their email bounces is a row that
-- does nothing for them or for us.
--
-- A PLAIN `set not null` IS THE WRONG TOOL HERE, and that is the whole
-- reason this is a check constraint instead. `set not null` validates every
-- existing row and FAILS the migration if any member joined without a
-- phone — which the previous version of the form allowed. The honest
-- requirement is "from now on", not "retroactively", and `not valid` says
-- exactly that: Postgres enforces the constraint on every insert and update
-- from this moment and leaves the rows already there alone.
--
-- To tighten it later, once the handful of early members have been chased
-- for a number:  alter table public.club_members validate constraint
-- club_members_phone_present;  — that pass fails loudly if any row still
-- has none, which is the right way to find out.
--
-- The constraint rejects an EMPTY STRING as well as a null. club_claim
-- writes `nullif(btrim(...), '')`, so a blank arrives as null — but a
-- future caller that does not would otherwise satisfy "not null" with a
-- value nobody can dial.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'club_members_phone_present'
      and conrelid = 'public.club_members'::regclass
  ) then
    alter table public.club_members
      add constraint club_members_phone_present
      check (phone is not null and btrim(phone) <> '')
      not valid;
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 2. club_check_serial — step one's entire answer.
-- ---------------------------------------------------------------------
-- Returns jsonb, and it is deliberately a VERY short vocabulary:
--
--   {"code": "OK"}            the serial exists and nobody has claimed it
--   {"code": "CLAIMED"}       the serial exists and a member already has it
--   {"code": "INVALID"}       everything else
--   {"code": "RATE_LIMITED"}  too many failures from this caller this hour
--
-- =====================================================================
-- "INVALID" MEANS BOTH "THAT IS NOT A SERIAL" AND "WE HAVE NEVER HEARD OF
-- IT", AND THE TWO MUST STAY INDISTINGUISHABLE.
-- =====================================================================
-- This differs from club_claim, which returns NOT_FOUND and INVALID
-- separately and relies on clubErrorMessage in lib/club-server.js to render
-- them identically. That split is fine for a form that also demands a name,
-- an email and a tick-box; it is NOT fine for a one-field endpoint whose
-- whole job is to answer questions about serials quickly. A caller who can
-- ask "is this a real serial?" and tell a typo from a miss has been handed
-- an oracle: the check letter is public arithmetic, so generating
-- well-formed candidates is trivial, and the only thing between that and a
-- list of real units in a warehouse is this function refusing to say.
--
-- So the conflation happens HERE, in SQL, not in the route handler. There
-- is then no code path that could return the distinction by accident.
--
-- CLAIMED IS DELIBERATELY DIFFERENT, and it is the same considered trade
-- club_claim already makes: it admits a serial exists. The person hitting
-- it is overwhelmingly someone who joined months ago and forgot, and
-- sending them round the "check your serial" loop forever is a real cost to
-- a real owner. The rate limit is what makes it safe to say.
--
-- THE RATE LIMIT IS SHARED. `club_attempts` is one table and `p_key_hash`
-- is the same salted hash the join and sign-in routes compute, so five
-- failures an hour is five across check-serial AND join AND sign-in
-- together — not five each. Without that, step one would be a fresh
-- allowance an enumerator could spend before touching the join at all.
--
-- `p_key_hash` has a default so the signature can be called with two
-- arguments, but a null one is treated as "no limit is possible" by
-- club_rate_limited and REFUSED. Fail closed.
--
-- NOT COUNTED AS A FAILURE: an OK, and a CLAIMED. Neither is what an
-- enumeration attempt looks like, and a household sharing one connection
-- must not lock itself out by having two people check their own boxes.
create or replace function public.club_check_serial(
  p_server_key text,
  p_serial     text,
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

  v_serial := upper(regexp_replace(coalesce(p_serial, ''), '[[:space:]-]', '', 'g'));

  if length(v_serial) <> 11 then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'INVALID');
  end if;

  -- The check letter, a FOURTH time: the browser, the route handler, and
  -- club_claim all compute it too. Same weights 1..10, same modulo 23, same
  -- transcription as club_claim in 20261024_club.sql and checkLetter() in
  -- lib/club-serial.js. Postgres strings are 1-indexed, so `i` IS the weight.
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

  select true into v_exists from public.club_serials where serial = v_serial;
  if v_exists is not true then
    -- INVALID, not NOT_FOUND. See the header: a well-formed serial we have
    -- never heard of must be indistinguishable from a malformed one.
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'INVALID');
  end if;

  select true into v_taken from public.club_members where serial = v_serial;
  if v_taken is true then
    return jsonb_build_object('code', 'CLAIMED');
  end if;

  -- OK is NOT a reservation. Nothing is written, nothing is held, and two
  -- people checking the same serial both get OK. The unique index on
  -- club_members.serial is what decides who actually gets it, at the moment
  -- one of them finishes step two.
  return jsonb_build_object('code', 'OK');
end;
$$;


-- ---------------------------------------------------------------------
-- 3. club_claim — the phone number is now required here too.
-- ---------------------------------------------------------------------
-- `create or replace` with the SAME signature as 20261024_club.sql, so this
-- replaces that definition rather than adding an overload. The only change
-- is the phone check; everything else is reproduced verbatim, deliberately,
-- because a replaced function is the whole function and half of it cannot
-- be inherited.
--
-- The phone is validated the same way the name and the email are: AFTER the
-- serial checks and WITHOUT recording a rate-limit attempt. A missing phone
-- number is a form error made by somebody who already holds a valid serial,
-- and burning their hourly allowance over it would lock a real owner out of
-- their own membership.
--
-- The SHAPE is not checked here — "a real Indian mobile" is
-- normalizePhone() in lib/web3forms.js, which the route applies before
-- calling this, and which turns every spelling into +91XXXXXXXXXX. SQL
-- checks that there IS one.
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

  if p_consent is not true then
    return jsonb_build_object('code', 'INVALID');
  end if;

  v_serial := upper(regexp_replace(coalesce(p_serial, ''), '[[:space:]-]', '', 'g'));

  if length(v_serial) <> 11 then
    insert into public.club_attempts (key_hash) values (p_key_hash);
    return jsonb_build_object('code', 'INVALID');
  end if;

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

  -- NO ATTEMPT IS RECORDED for the three checks below, unlike every serial
  -- check above them. Only serial-shaped failures count towards the limit,
  -- because only those are what an enumeration attempt looks like.
  if p_name is null or btrim(p_name) = '' or length(p_name) > 60 then
    return jsonb_build_object('code', 'INVALID');
  end if;
  if p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(p_email) > 160 then
    return jsonb_build_object('code', 'INVALID');
  end if;
  -- NEW IN THIS MIGRATION: the mobile number is required.
  if p_phone is null or btrim(p_phone) = '' or length(p_phone) > 20 then
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
-- 4. Grants. EXECUTE only, and only on the new entry point.
-- ---------------------------------------------------------------------
-- club_claim's grant survives `create or replace` — the signature is
-- unchanged, so it is the same function object with new a body — but it is
-- restated here so that running this file against a fresh database leaves
-- the same state as running it against an existing one.
--
-- Granting EXECUTE to anon is what makes the function reachable with the
-- public key at all; `p_server_key` is what makes that safe. Both halves
-- are required.
grant execute on function public.club_check_serial(text, text, text) to anon;
grant execute on function public.club_claim(text, text, text, text, text, text, boolean, text)
  to anon;
