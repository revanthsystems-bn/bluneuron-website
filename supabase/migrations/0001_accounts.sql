-- =====================================================================
-- BluNeuron accounts — tables, Row Level Security, and the policies.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL Editor and run it
-- once. It is idempotent (`if not exists` / `drop policy if exists`), so
-- running it again is safe.
--
-- THE SECURITY MODEL, in one paragraph. The browser holds the publishable
-- (anon) key, which is public by design. Every table below has RLS ENABLED
-- and a policy per operation keyed on `auth.uid() = user_id`, so Postgres —
-- not the application — decides which rows anyone can see or change. A
-- client that asks for `select * from addresses` gets its own rows and no
-- one else's, and that remains true if someone calls the REST endpoint
-- directly with the key out of the page source. The application code
-- deliberately does NOT add `where user_id = …`: a client-side filter is a
-- convenience, and writing one would imply it was the boundary.
--
-- `user_id` DEFAULTS TO `auth.uid()` on every table, and the insert policy
-- requires it to equal `auth.uid()`. That pair is what stops a client
-- writing a row into someone else's account: it cannot omit the column (the
-- default fills it in) and it cannot set it to someone else (the policy
-- rejects it).
--
-- NOTE ON THE SERVICE ROLE KEY: nothing here needs it. It bypasses RLS
-- entirely and must never reach a browser bundle. Deleting a row is done by
-- the owner under these policies; deleting the AUTH USER itself is the one
-- operation that needs elevated rights, and that is handled by hand.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. profiles — one row per person, keyed by their auth user id.
--
-- `id` IS the auth user id rather than a separate key with a `user_id`
-- beside it: there is exactly one profile per user, so a second identifier
-- would be a second thing that can disagree. The cascade means deleting the
-- auth user takes the profile with it.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by their owner"  on public.profiles;
drop policy if exists "profiles are insertable by their owner" on public.profiles;
drop policy if exists "profiles are updatable by their owner"  on public.profiles;
drop policy if exists "profiles are deletable by their owner"  on public.profiles;

create policy "profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are insertable by their owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles are updatable by their owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles are deletable by their owner"
  on public.profiles for delete
  using (auth.uid() = id);


-- ---------------------------------------------------------------------
-- 2. addresses — several per person, exactly one default.
--
-- THE SINGLE DEFAULT IS ENFORCED BY A UNIQUE PARTIAL INDEX, not by the
-- application. "Unset the others, then set this one" from a browser is two
-- round trips with a gap in the middle; two tabs doing it at once leaves two
-- defaults, and nothing would ever notice. The index makes the second one
-- impossible.
-- ---------------------------------------------------------------------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null default 'Home',
  full_name   text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

create unique index if not exists addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

alter table public.addresses enable row level security;

drop policy if exists "addresses are readable by their owner"  on public.addresses;
drop policy if exists "addresses are insertable by their owner" on public.addresses;
drop policy if exists "addresses are updatable by their owner"  on public.addresses;
drop policy if exists "addresses are deletable by their owner"  on public.addresses;

create policy "addresses are readable by their owner"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "addresses are insertable by their owner"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "addresses are updatable by their owner"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "addresses are deletable by their owner"
  on public.addresses for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 3. registered_products — a unit, its purchase, and its warranty window.
--
-- `warranty_end_date` IS A GENERATED COLUMN: purchase date + one year,
-- computed by Postgres and not writable. Storing it as an ordinary column
-- would let a row disagree with /legal/warranty about how long cover runs,
-- and the row would win on the one screen a customer checks. The expression
-- is immutable (`date + interval` then a cast), which is what `stored`
-- requires.
--
-- If the warranty term ever changes, EXISTING ROWS KEEP THE OLD TERM only if
-- you add a column for it. Today there is one term, stated once in
-- lib/site-config.js (WARRANTY.months = 12) and once here. Those two are the
-- pair to keep in step.
--
-- `serial_number` is unique per user, not globally: a customer cannot
-- register the same unit twice, but a genuine resale or a data-entry clash
-- between two customers is not this table's business to adjudicate.
-- ---------------------------------------------------------------------
create table if not exists public.registered_products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_name  text not null default 'BluNeuron IRIZ',
  marketplace   text not null check (marketplace in ('Amazon', 'Flipkart', 'Other')),
  order_id      text not null,
  serial_number text not null,
  purchase_date date not null,
  warranty_end_date date generated always as ((purchase_date + interval '1 year')::date) stored,
  status        text not null default 'Registered'
                check (status in ('Registered', 'In service', 'Replaced', 'Closed')),
  created_at    timestamptz not null default now()
);

create index if not exists registered_products_user_id_idx on public.registered_products (user_id);

create unique index if not exists registered_products_serial_per_user
  on public.registered_products (user_id, serial_number);

alter table public.registered_products enable row level security;

drop policy if exists "products are readable by their owner"  on public.registered_products;
drop policy if exists "products are insertable by their owner" on public.registered_products;
drop policy if exists "products are updatable by their owner"  on public.registered_products;
drop policy if exists "products are deletable by their owner"  on public.registered_products;

create policy "products are readable by their owner"
  on public.registered_products for select
  using (auth.uid() = user_id);

create policy "products are insertable by their owner"
  on public.registered_products for insert
  with check (auth.uid() = user_id);

create policy "products are updatable by their owner"
  on public.registered_products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "products are deletable by their owner"
  on public.registered_products for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 4. warranty_claims — a claim against one registered unit.
--
-- THE PRODUCT REFERENCE IS DOUBLE-CHECKED. The foreign key says the product
-- exists; the insert policy's `exists (… and user_id = auth.uid())` says it
-- is YOURS. Without the second half, a client could file a claim against a
-- product id belonging to someone else — the row would be theirs, the claim
-- would be about a stranger's unit, and no constraint would object.
--
-- `status` is ours to move, not the customer's. The update policy still
-- allows it (there is no column-level restriction in RLS), which is the
-- known limit of doing this entirely client-side: a determined customer can
-- set their own claim to "Resolved". That is a nuisance, not a breach — it
-- touches only their row — and the fix when it matters is to move status
-- changes behind a server route.
-- ---------------------------------------------------------------------
create table if not exists public.warranty_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id  uuid references public.registered_products (id) on delete set null,
  issue       text not null,
  status      text not null default 'Open'
              check (status in ('Open', 'In review', 'In service', 'Resolved', 'Rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists warranty_claims_user_id_idx on public.warranty_claims (user_id);

alter table public.warranty_claims enable row level security;

drop policy if exists "claims are readable by their owner"  on public.warranty_claims;
drop policy if exists "claims are insertable by their owner" on public.warranty_claims;
drop policy if exists "claims are updatable by their owner"  on public.warranty_claims;
drop policy if exists "claims are deletable by their owner"  on public.warranty_claims;

create policy "claims are readable by their owner"
  on public.warranty_claims for select
  using (auth.uid() = user_id);

create policy "claims are insertable by their owner"
  on public.warranty_claims for insert
  with check (
    auth.uid() = user_id
    and (
      product_id is null
      or exists (
        select 1 from public.registered_products p
        where p.id = product_id and p.user_id = auth.uid()
      )
    )
  );

create policy "claims are updatable by their owner"
  on public.warranty_claims for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "claims are deletable by their owner"
  on public.warranty_claims for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 5. updated_at on profiles.
--
-- A trigger rather than the application sending a timestamp: a client clock
-- is wrong often enough to matter, and a column meaning "when the server
-- last changed this" should be set by the server.
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- 6. Verification. Run this last; every row should read `true`.
--
-- It checks the thing most easily got wrong: a table with policies on it but
-- RLS never ENABLED. Policies on a table without RLS are inert, and the
-- table is world-readable to anyone holding the publishable key — which is
-- everyone. The dashboard shows this too, but a query you can re-run after
-- every migration is better than a screen you have to remember to look at.
-- ---------------------------------------------------------------------
select
  relname                        as table_name,
  relrowsecurity                 as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'addresses', 'registered_products', 'warranty_claims')
order by relname;
