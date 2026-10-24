-- =====================================================================
-- 0002 — warranty registration, written to Supabase AND to the Sheet.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and run it once, after
-- 0001_accounts.sql. Idempotent; running it again is safe.
--
-- WHAT CHANGED AND WHY. A signed-in customer's registration is now recorded
-- twice: a row here, owned by them and visible in "My products & warranty",
-- and a line in the support team's Google Sheet through
-- app/api/warranty-registration/route.js. Three columns make that work.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The marketplace CHECK constraint has to change first.
--
-- 0001 allowed ('Amazon', 'Flipkart', 'Other'). The form now offers
-- "Other seller" — the string, not "Other" — so a signed-in registration
-- from an unauthorised reseller would be rejected by Postgres with a
-- constraint violation the customer could do nothing about. This is the
-- failure that would have shipped silently: the Sheet write succeeds, the
-- Supabase write fails, and the unit never appears in the account.
--
-- "BluNeuron Website" is allowed here even though the form does not offer it
-- yet (DIRECT_SALES_ENABLED is false in lib/site-config.js). A constraint
-- that has to be migrated on the day a payment gateway launches is a
-- constraint that will be discovered at the worst possible moment.
-- ---------------------------------------------------------------------
alter table public.registered_products
  drop constraint if exists registered_products_marketplace_check;

alter table public.registered_products
  add constraint registered_products_marketplace_check
  check (marketplace in ('Amazon', 'Flipkart', 'Other seller', 'BluNeuron Website'));


-- ---------------------------------------------------------------------
-- 2. registration_id — the SAME id as the Sheet row.
--
-- Written by the browser, which mints it once and sends it to both
-- destinations, so a support agent looking at a spreadsheet line can find
-- the account row without matching on name and date and hoping.
--
-- UNIQUE PER USER, not globally. Two customers cannot collide in practice
-- (it is a v4 UUID), and a per-user index keeps the uniqueness failure
-- contained to the person who caused it — a retry of the same registration
-- is rejected as a duplicate, which is the point.
--
-- NULLABLE, because rows created before this migration do not have one, and
-- because a registration written straight into the account (without going
-- through the Sheet) is still a valid registration.
-- ---------------------------------------------------------------------
alter table public.registered_products
  add column if not exists registration_id uuid;

create unique index if not exists registered_products_registration_id_per_user
  on public.registered_products (user_id, registration_id)
  where registration_id is not null;


-- ---------------------------------------------------------------------
-- 3. needs_verification — provenance we cannot confirm ourselves.
--
-- True when the purchase source is not one we can check against our own
-- records (today: anything other than Amazon or Flipkart). The warranty
-- covers units bought from BluNeuron or an authorised seller, so these are
-- ACCEPTED and FLAGGED rather than refused — refusing at the form only
-- teaches people to pick "Amazon" and record a confident falsehood.
--
-- The same flag is written to the Sheet's "Needs verification" column, so
-- whichever surface support is looking at tells the same story.
--
-- GENERATED, not supplied. A client that could set this could also clear it,
-- and the one thing this column must not be is customer-editable.
-- ---------------------------------------------------------------------
alter table public.registered_products
  drop column if exists needs_verification;

alter table public.registered_products
  add column needs_verification boolean
  generated always as (marketplace not in ('Amazon', 'Flipkart')) stored;


-- ---------------------------------------------------------------------
-- 4. Verify. Every row should read `true`.
-- ---------------------------------------------------------------------
select
  'registration_id exists' as check,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registered_products'
      and column_name = 'registration_id'
  ) as ok
union all
select
  'needs_verification is generated',
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registered_products'
      and column_name = 'needs_verification' and is_generated = 'ALWAYS'
  )
union all
select
  'marketplace accepts "Other seller"',
  (
    select pg_get_constraintdef(oid) like '%Other seller%'
    from pg_constraint
    where conname = 'registered_products_marketplace_check'
  );
