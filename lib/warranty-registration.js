import { getSupabaseBrowserClient } from './supabase/client';
import { DEMO_MODE } from './supabase/config';
import { submitWarrantyRegistration } from './web3forms';

/**
 * Registering a unit, written to BOTH places, from one click.
 *
 * TWO DESTINATIONS, AND THEY ARE NOT INTERCHANGEABLE:
 *
 *   Google Sheet   always, for every registration, signed in or not. It is
 *                  what the support team actually works from, and a
 *                  signed-out customer has nowhere else for the record to
 *                  live. Written through the server route
 *                  (app/api/warranty-registration), which holds the Apps
 *                  Script token — a secret that must never reach a browser.
 *
 *   Supabase       only when signed in. It is what makes the unit appear in
 *                  "My products & warranty" with a warranty end date, and it
 *                  is written FROM THE BROWSER under Row Level Security, so
 *                  the row belongs to the person who created it by
 *                  construction rather than by the server being careful.
 *
 * ONE ID ACROSS BOTH. `crypto.randomUUID()` is minted here, once, and sent to
 * both. Without it a support agent holding a spreadsheet line would have to
 * find the matching account row by name and date and hope. The Apps Script
 * de-duplicates on it, and `registered_products.registration_id` is unique
 * per user — so a double submit is one registration in both places, not two.
 *
 * NEITHER FAILURE KILLS THE OTHER. They are awaited together with
 * `allSettled`, deliberately: if the Sheet is down, a signed-in customer
 * still gets the unit in their account; if Supabase rejects the row, the
 * support team still has the registration. The caller is told exactly which
 * half landed, because "something went wrong" after a successful save is how
 * a customer ends up registering the same unit four times.
 *
 * THE RETURN SHAPE is the whole contract:
 *   { ok, savedToSheet, savedToAccount, signedIn, registrationId, message, error }
 * `ok` is true when ANY destination accepted it — the registration exists
 * somewhere and the customer should not be told to try again.
 *
 * ---------------------------------------------------------------------------
 * THE DATA INVENTORY: three stores hold a serial number, and only two of
 * them are this file's business.
 * ---------------------------------------------------------------------------
 *
 *   Google Sheet        warranty registrations and claims. Name, email,
 *                       phone, marketplace, order ID, purchase date, serial,
 *                       and on a claim the fault description. Written by
 *                       app/api/warranty-{registration,claim}.
 *
 *   Supabase            `registered_products` etc., for signed-in customers
 *   (accounts)          only. Row Level Security scopes every row to its
 *                       owner. ACCOUNTS_ENABLED is false today, so nothing
 *                       is being written here.
 *
 *   Supabase            `club_members` — THE IRIZ CLUB, and a SEPARATE
 *   (the Club)          record from both of the above. First name, email,
 *                       optional phone and city, the serial used to join,
 *                       and the consent timestamp. Written only by
 *                       app/api/club/join through a SECURITY DEFINER
 *                       function; anon cannot touch the table. See
 *                       supabase/migrations/20261024_club.sql and
 *                       docs/club-setup.md.
 *
 * THE SERIAL NUMBER IS THE ONLY FIELD THE THREE SHARE, and they are NOT
 * joined. Joining the Club does not register a warranty and deleting a
 * membership does not delete a registration — /legal/privacy says so in as
 * many words, because a customer who asks to "delete my data" means
 * something specific and we have to ask which.
 *
 * Every one of the three is listed under "What we collect" and "How long we
 * keep it" in /legal/privacy. Adding a fourth store means adding it there in
 * the same commit.
 */
export async function registerWarranty(fields) {
  const registrationId = crypto.randomUUID();

  const supabase = DEMO_MODE ? null : getSupabaseBrowserClient();
  const user = supabase ? (await supabase.auth.getUser()).data?.user ?? null : null;
  const signedIn = Boolean(user);

  const [sheetResult, accountResult] = await Promise.allSettled([
    submitWarrantyRegistration({ ...fields, registrationId }),
    signedIn ? saveToAccount(supabase, fields, registrationId) : Promise.resolve(null),
  ]);

  const savedToSheet = sheetResult.status === 'fulfilled';
  const savedToAccount = signedIn && accountResult.status === 'fulfilled';

  // Logged WITHOUT the customer's details. A console line carrying a name,
  // an email and a serial number is a privacy leak into whatever collects
  // browser logs; the registration id is enough to find the record.
  if (!savedToSheet) {
    // eslint-disable-next-line no-console
    console.error(
      `[BluNeuron] Registration ${registrationId}: support-sheet write failed —`,
      sheetResult.reason?.message ?? 'unknown error'
    );
  }
  if (signedIn && !savedToAccount) {
    // eslint-disable-next-line no-console
    console.error(
      `[BluNeuron] Registration ${registrationId}: account write failed —`,
      accountResult.reason?.message ?? 'unknown error'
    );
  }

  return {
    ok: savedToSheet || savedToAccount,
    savedToSheet,
    savedToAccount,
    signedIn,
    registrationId,
    message: describe({ savedToSheet, savedToAccount, signedIn }),
    error:
      savedToSheet || savedToAccount
        ? null
        : sheetResult.reason?.message ?? 'Could not save your registration. Please try again.',
  };
}

/**
 * The Supabase half.
 *
 * `user_id` is NOT sent. The column defaults to `auth.uid()` and the insert
 * policy requires it to equal `auth.uid()`, so the database decides whose
 * row this is — a client cannot write into someone else's account even by
 * asking. `needs_verification` is not sent either: it is a generated column
 * (marketplace not in Amazon/Flipkart), so a customer cannot clear their own
 * flag. See supabase/migrations/0002_registration_sync.sql.
 */
async function saveToAccount(supabase, fields, registrationId) {
  const { error } = await supabase.from('registered_products').insert({
    registration_id: registrationId,
    marketplace: fields.marketplace,
    order_id: fields.orderId,
    serial_number: fields.serialNumber,
    purchase_date: fields.purchaseDate,
  });

  if (error) {
    // A repeat submit of the same unit is not a failure worth alarming
    // anyone about — the registration already exists and is already theirs.
    if (error.code === '23505') return { duplicate: true };
    throw new Error(error.message);
  }
  return { duplicate: false };
}

/** What to tell the customer, in their terms rather than ours. */
function describe({ savedToSheet, savedToAccount, signedIn }) {
  if (savedToAccount && savedToSheet) {
    return 'We have your purchase details on file, and this unit now appears under My products & warranty in your account.';
  }
  if (savedToAccount && !savedToSheet) {
    return 'This unit now appears under My products & warranty in your account. Our support team will pick up the rest shortly.';
  }
  if (!signedIn && savedToSheet) {
    return 'We have your purchase details on file. Sign in with this email address and the unit will show up under My products & warranty, with its warranty end date.';
  }
  if (savedToSheet) {
    return 'We have your purchase details on file.';
  }
  return 'We could not save your registration.';
}
