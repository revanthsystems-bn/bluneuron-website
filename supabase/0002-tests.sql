-- =====================================================================
-- 0002 TESTS — run in the Supabase SQL Editor after 0002_registration_sync.sql.
--
-- WHAT THIS PROVES: that the dual-write actually holds. A registration is
-- written twice (Supabase + the Google Sheet) and the two are tied together
-- by one id, so three things have to be true and none of them is obvious
-- from reading the migration:
--
--   * "Other seller" is ACCEPTED. 0001's CHECK constraint allowed only
--     ('Amazon','Flipkart','Other'), and the form now sends "Other seller".
--     Without the constraint change the Sheet write would succeed, the
--     Supabase write would fail, and the unit would never appear in the
--     customer's account — a half-registration, silently.
--   * It is FLAGGED, and Amazon is not.
--   * needs_verification cannot be set by a client. It is a generated
--     column precisely so a customer cannot clear their own flag.
--
-- Runs in a transaction and ROLLS BACK: safe against the real project.
-- Expected output: 7 rows, all PASS.
-- =====================================================================

begin;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111','alice@example.invalid')
on conflict (id) do nothing;
create temporary table r (test text, outcome text) on commit drop;
grant all on r to authenticated;

do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  rid uuid := '33333333-3333-4333-8333-333333333333';
  flagged boolean; n int;
begin
  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims', json_build_object('sub',alice)::text, true);

  -- An "Other seller" registration must be ACCEPTED (0001 would have rejected it).
  insert into public.registered_products (marketplace, order_id, serial_number, purchase_date, registration_id)
  values ('Other seller','ORD-1','SER-1', date '2026-03-01', rid);
  insert into r values ('Other seller registration is accepted','PASS');

  -- ...and FLAGGED.
  select needs_verification into flagged from public.registered_products where registration_id = rid;
  insert into r values ('Other seller is flagged for verification', case when flagged then 'PASS' else 'FAIL' end);

  -- Amazon must NOT be flagged.
  insert into public.registered_products (marketplace, order_id, serial_number, purchase_date)
  values ('Amazon','ORD-2','SER-2', date '2026-03-02');
  select needs_verification into flagged from public.registered_products where serial_number='SER-2';
  insert into r values ('Amazon is not flagged', case when flagged then 'FAIL' else 'PASS' end);

  -- needs_verification is generated: a client cannot set it.
  begin
    update public.registered_products set needs_verification = false where registration_id = rid;
    insert into r values ('needs_verification cannot be written by a client','FAIL');
  exception when others then
    insert into r values ('needs_verification cannot be written by a client','PASS');
  end;

  -- The same registrationId twice is one registration, not two.
  begin
    insert into public.registered_products (marketplace, order_id, serial_number, purchase_date, registration_id)
    values ('Amazon','ORD-3','SER-3', date '2026-03-03', rid);
    insert into r values ('duplicate registration_id is rejected','FAIL');
  exception when unique_violation then
    insert into r values ('duplicate registration_id is rejected','PASS');
  end;

  -- A null registration_id is allowed more than once (partial index).
  insert into public.registered_products (marketplace, order_id, serial_number, purchase_date)
  values ('Flipkart','ORD-4','SER-4', date '2026-03-04');
  select count(*) into n from public.registered_products where registration_id is null;
  insert into r values ('several rows may have no registration_id', case when n >= 2 then 'PASS' else 'FAIL' end);

  -- An invented source is still rejected.
  begin
    insert into public.registered_products (marketplace, order_id, serial_number, purchase_date)
    values ('Craigslist','ORD-5','SER-5', date '2026-03-05');
    insert into r values ('an unknown marketplace is rejected','FAIL');
  exception when check_violation then
    insert into r values ('an unknown marketplace is rejected','PASS');
  end;

  perform set_config('role','postgres',true);
end $$;

select test, outcome from r order by outcome desc, test;
rollback;
