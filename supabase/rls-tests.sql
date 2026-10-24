-- =====================================================================
-- RLS TESTS — run this in the Supabase SQL Editor after 0001_accounts.sql.
--
-- WHAT THIS PROVES, and why it is worth the twenty seconds: that one
-- customer cannot read, change or delete another customer's rows. Every
-- policy in the migration says `auth.uid() = user_id`, which LOOKS obviously
-- correct and is exactly the kind of thing that is silently wrong — a table
-- where RLS was never ENABLED has its policies ignored entirely, and the
-- table is then readable by anyone holding the publishable key, which is
-- everyone. Nothing in the application would behave differently. This file
-- is the only thing that would notice.
--
-- HOW IT FAKES TWO USERS. Supabase's `auth.uid()` reads the `sub` claim out
-- of the `request.jwt.claims` setting, so setting that setting is exactly
-- what the API does when a signed-in user makes a request. The role is set
-- to `authenticated` for the same reason: policies are granted to that role,
-- and running as the table owner bypasses RLS no matter what the policies
-- say.
--
-- IT CLEANS UP AFTER ITSELF. The whole thing runs in a transaction that is
-- ROLLED BACK at the end, so it writes nothing permanent — you can run it
-- against the real project without leaving test rows behind.
--
-- EXPECTED OUTPUT: a list of test names each followed by `PASS`. Any `FAIL`
-- is a real hole; do not deploy past one.
-- =====================================================================

begin;

-- TWO TEST USERS, created for real and rolled back with everything else.
--
-- The first draft of this file tried `set constraints all deferred` instead,
-- on the assumption that the foreign keys to auth.users could be put off to
-- the end of the transaction. They cannot: a constraint is only deferrable
-- if it was DECLARED deferrable, and these were not, so the statement
-- succeeded and changed nothing while the first insert failed on the key.
-- Creating the rows is the honest fix, and the rollback at the end removes
-- them.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.invalid'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.invalid')
on conflict (id) do nothing;

create temporary table rls_results (test text, outcome text) on commit drop;

-- The block below switches to the `authenticated` role to exercise the
-- policies, and that role does not own this scratch table — so without this
-- grant every result insert fails with "permission denied" and the whole
-- transaction aborts on the first assertion.
grant all on rls_results to authenticated;

do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  bob   uuid := '22222222-2222-2222-2222-222222222222';
  alice_address uuid;
  alice_product uuid;
  visible_count int;
  affected int;
begin
  -- ---------------------------------------------------------------
  -- Become Alice and create one of everything.
  -- ---------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', alice)::text, true);

  insert into public.addresses (full_name, line1, city, state, pincode, is_default)
  values ('Alice', '1 Test Street', 'Coimbatore', 'Tamil Nadu', '641004', true)
  returning id into alice_address;

  insert into public.registered_products (marketplace, order_id, serial_number, purchase_date)
  values ('Amazon', 'TEST-ORDER-A', 'SERIAL-A', date '2026-01-15')
  returning id into alice_product;

  insert into public.warranty_claims (product_id, issue)
  values (alice_product, 'Test claim from Alice');

  -- `user_id` was never supplied: the column default is auth.uid(). If that
  -- default were missing, these rows would belong to nobody and the policies
  -- would be meaningless.
  select count(*) into visible_count from public.addresses where user_id = alice;
  insert into rls_results values (
    'default user_id is auth.uid()',
    case when visible_count = 1 then 'PASS' else 'FAIL' end
  );

  -- Alice sees her own rows.
  select count(*) into visible_count from public.addresses;
  insert into rls_results values (
    'owner can read own addresses',
    case when visible_count = 1 then 'PASS' else 'FAIL' end
  );

  -- The generated column computed a date a year on, rather than storing null.
  select count(*) into visible_count
  from public.registered_products
  where id = alice_product and warranty_end_date = date '2027-01-15';
  insert into rls_results values (
    'warranty_end_date = purchase_date + 1 year',
    case when visible_count = 1 then 'PASS' else 'FAIL' end
  );

  -- ---------------------------------------------------------------
  -- Become Bob. Everything of Alice's must be invisible and untouchable.
  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', bob)::text, true);

  select count(*) into visible_count from public.addresses;
  insert into rls_results values (
    'other user cannot READ addresses',
    case when visible_count = 0 then 'PASS' else 'FAIL' end
  );

  select count(*) into visible_count from public.registered_products;
  insert into rls_results values (
    'other user cannot READ registered products',
    case when visible_count = 0 then 'PASS' else 'FAIL' end
  );

  select count(*) into visible_count from public.warranty_claims;
  insert into rls_results values (
    'other user cannot READ warranty claims',
    case when visible_count = 0 then 'PASS' else 'FAIL' end
  );

  -- An UPDATE that matches no visible row affects zero rows rather than
  -- raising. Zero is the pass: the row exists, Bob simply cannot see it.
  update public.addresses set city = 'Hacked' where id = alice_address;
  get diagnostics affected = row_count;
  insert into rls_results values (
    'other user cannot UPDATE an address',
    case when affected = 0 then 'PASS' else 'FAIL' end
  );

  delete from public.registered_products where id = alice_product;
  get diagnostics affected = row_count;
  insert into rls_results values (
    'other user cannot DELETE a product',
    case when affected = 0 then 'PASS' else 'FAIL' end
  );

  -- Bob tries to plant a row in Alice's account by naming her id directly.
  -- The insert policy's WITH CHECK must reject it.
  begin
    insert into public.addresses (user_id, full_name, line1, city, state, pincode)
    values (alice, 'Bob', '2 Attack Road', 'Chennai', 'Tamil Nadu', '600001');
    insert into rls_results values ('cannot INSERT a row owned by someone else', 'FAIL');
  exception when insufficient_privilege or check_violation then
    insert into rls_results values ('cannot INSERT a row owned by someone else', 'PASS');
  end;

  -- Bob tries to file a claim against Alice's product under his own user_id.
  -- The foreign key is satisfied; only the policy's EXISTS clause stops it.
  begin
    insert into public.warranty_claims (product_id, issue)
    values (alice_product, 'Bob claiming on Alice''s unit');
    insert into rls_results values ('cannot CLAIM against another user''s product', 'FAIL');
  exception when insufficient_privilege or check_violation then
    insert into rls_results values ('cannot CLAIM against another user''s product', 'PASS');
  end;

  -- ---------------------------------------------------------------
  -- Back to Alice: the single-default index must reject a second default.
  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', alice)::text, true);

  begin
    insert into public.addresses (full_name, line1, city, state, pincode, is_default)
    values ('Alice', '3 Second Street', 'Coimbatore', 'Tamil Nadu', '641004', true);
    insert into rls_results values ('only one default address per user', 'FAIL');
  exception when unique_violation then
    insert into rls_results values ('only one default address per user', 'PASS');
  end;

  -- A second address that is NOT the default is fine.
  insert into public.addresses (full_name, line1, city, state, pincode, is_default)
  values ('Alice', '3 Second Street', 'Coimbatore', 'Tamil Nadu', '641004', false);
  insert into rls_results values ('a second non-default address is allowed', 'PASS');

  -- The same serial number twice is a duplicate registration.
  begin
    insert into public.registered_products (marketplace, order_id, serial_number, purchase_date)
    values ('Flipkart', 'TEST-ORDER-B', 'SERIAL-A', date '2026-02-01');
    insert into rls_results values ('cannot register the same serial twice', 'FAIL');
  exception when unique_violation then
    insert into rls_results values ('cannot register the same serial twice', 'PASS');
  end;

  perform set_config('role', 'postgres', true);
end;
$$;

-- RLS must be ENABLED, not merely have policies attached. A table with
-- policies and RLS off is wide open and looks completely normal.
insert into rls_results
select
  format('RLS enabled on %s', c.relname),
  case when c.relrowsecurity then 'PASS' else 'FAIL' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'addresses', 'registered_products', 'warranty_claims');

select test, outcome from rls_results order by outcome desc, test;

-- Nothing above is kept.
rollback;
