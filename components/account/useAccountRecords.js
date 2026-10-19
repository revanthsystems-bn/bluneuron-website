'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from './AccountContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEMO_MODE } from '@/lib/supabase/config';
import { DEMO_ADDRESSES, DEMO_CLAIMS, DEMO_PRODUCTS } from '@/lib/account-demo';
import { MEDIA } from '@/lib/iriz';

/**
 * The account's rows: profile, addresses, registered products, claims.
 *
 * ONE HOOK FOR ALL FOUR, because they are read together on every account
 * page and because a page that fetched only its own table would show a
 * loading state per section. Supabase returns these in four small queries
 * that run in parallel; the whole set is a handful of rows per user.
 *
 * WHY THE QUERIES CARRY NO `WHERE user_id = …`. They do not need one. Row
 * Level Security does the filtering in Postgres: every policy on these
 * tables is `USING (auth.uid() = user_id)`, so `select * from addresses`
 * returns exactly the signed-in user's addresses and nothing else — even if
 * this code asked for everything, even if someone called the REST endpoint
 * directly with the publishable key. A client-side `WHERE` is a convenience,
 * not a boundary, and writing one here would suggest otherwise. See
 * supabase/migrations/0001_accounts.sql.
 *
 * DEMO MODE returns fixtures immediately and never touches the network.
 *
 * `warrantyEnds` is computed by the DATABASE (a generated column), not here.
 * A date derived in two places is a date that eventually disagrees with
 * itself; the policy page, the account page and the row all have to say the
 * same thing.
 */
export function useAccountRecords() {
  const { user, hydrated } = useAccount();
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null,
    addresses: [],
    products: [],
    claims: [],
  });

  const load = useCallback(async () => {
    if (DEMO_MODE) {
      setState({
        loading: false,
        error: null,
        profile: null,
        addresses: DEMO_ADDRESSES,
        products: DEMO_PRODUCTS,
        claims: DEMO_CLAIMS,
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const [profile, addresses, products, claims] = await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('addresses').select('*').order('is_default', { ascending: false }),
      supabase.from('registered_products').select('*').order('purchase_date', { ascending: false }),
      supabase.from('warranty_claims').select('*').order('created_at', { ascending: false }),
    ]);

    const firstError = profile.error || addresses.error || products.error || claims.error;

    setState({
      loading: false,
      error: firstError ? firstError.message : null,
      profile: profile.data ?? null,
      addresses: (addresses.data ?? []).map(toAddress),
      products: (products.data ?? []).map(toProduct),
      claims: (claims.data ?? []).map(toClaim),
    });
  }, [user]);

  useEffect(() => {
    // Wait for the session to resolve. Querying before then runs as an
    // anonymous user, and RLS correctly returns nothing — which would render
    // "no products registered" to someone who has one, for one paint.
    if (!hydrated) return;
    load();
  }, [hydrated, load]);

  return { ...state, reload: load };
}

/* ------------------------------------------------------------------ *
 * Row shapes
 *
 * Postgres columns are snake_case; the components were written against the
 * camelCase fixtures in lib/account-demo.js. Mapping here rather than in
 * each component means the panels never learn which backend they are on,
 * and the demo fixtures stay the single description of the shape.
 * ------------------------------------------------------------------ */

function toAddress(row) {
  return {
    id: row.id,
    label: row.label,
    isDefault: row.is_default,
    name: row.full_name,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    phone: row.phone,
  };
}

function toProduct(row) {
  return {
    id: row.id,
    name: row.product_name,
    image: PRODUCT_IMAGE,
    marketplace: row.marketplace,
    orderId: row.order_id,
    serialNumber: row.serial_number,
    purchaseDate: row.purchase_date,
    // Generated column: purchase_date + 1 year, computed by Postgres.
    warrantyEnds: row.warranty_end_date,
    status: row.status,
  };
}

function toClaim(row) {
  return {
    id: row.id,
    productId: row.product_id,
    issue: row.issue,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * One SKU, so one picture. There is no image column on the table and there
 * should not be: storing a path per row would let two rows of the same
 * product disagree about what it looks like, and the asset is a front-end
 * concern that changes with a redesign, not with the data.
 */
const PRODUCT_IMAGE = MEDIA.product.heroClean;
