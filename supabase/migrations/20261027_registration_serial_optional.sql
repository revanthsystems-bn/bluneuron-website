-- =====================================================================
-- registered_products.serial_number becomes OPTIONAL.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and run it once. It is
-- idempotent — `drop not null` on a column that is already nullable is a
-- no-op, and the index rebuild below is guarded.
--
-- WHY. The warranty forms used to REQUIRE a serial number. They no longer
-- do: units sold before the carton labels existed have no printed serial,
-- and their owners were being asked for one that does not exist. See
-- parseOptionalSerial in lib/warranty.js.
--
-- Without this change a signed-in customer registering a unit with no serial
-- would have the Sheet row written and the ACCOUNT row rejected by the
-- not-null constraint — a half-landed registration, reported honestly by
-- lib/warranty-registration.js but still a failure nobody could fix.
--
-- THIS IS THE ACCOUNT AREA, WHICH IS STILL OFF (ACCOUNTS_ENABLED = false in
-- lib/site-config.js). Nothing writes this table today. It is here so that
-- the day accounts are switched on, the two halves already agree.
-- =====================================================================

alter table public.registered_products
  alter column serial_number drop not null;

-- The uniqueness rule is RESTATED, not changed. Postgres indexes default to
-- `nulls distinct`, so two null serials already do not collide and a
-- customer can already hold several unserialised units — the behaviour is
-- correct as it stands. Saying it as a PARTIAL index makes that explicit
-- rather than a property of a default somebody has to know, and it keeps the
-- nulls out of the index. The rule, in words: a serial is unique per
-- customer WHEN THERE IS ONE.
drop index if exists public.registered_products_serial_per_user;

create unique index if not exists registered_products_serial_per_user
  on public.registered_products (user_id, serial_number)
  where serial_number is not null;
