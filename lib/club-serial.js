/**
 * THE IRIZ SERIAL NUMBER, and the check letter that makes it self-verifying.
 *
 * ===========================================================================
 * THIS FILE MIRRORS THE LABEL SCRIPT. It is not an interpretation of it.
 * ===========================================================================
 * The same algorithm runs in three places that must agree exactly or a real
 * customer holding a real box cannot join:
 *
 *   1. the label script, which PRINTS the serial on the carton sticker
 *   2. this module, in the BROWSER, so a typo is caught before a request
 *   3. this module, on the SERVER, so the browser check cannot be bypassed
 *
 * Only (1) is outside this repository. If it ever changes, this changes with
 * it in the same hour, and `scripts/test-club-serial.mjs` is the thing that
 * proves the two still agree — it holds vectors produced by the real script.
 *
 * WHAT THE CHECK LETTER IS FOR, and what it is NOT.
 *
 * It catches a MIS-TYPED serial — a transposition, a wrong character, a
 * misread 0/O — before any database call, which is most of what goes wrong
 * when someone copies eleven characters off a sticker in bad light. It is
 * arithmetic, not a secret: anyone who knows the rule can generate a
 * well-formed serial, and this module makes no claim otherwise.
 *
 * WHAT ACTUALLY GATES MEMBERSHIP is `club_serials` in the database: a serial
 * must have been IMPORTED from the manufacturing run, and must not already be
 * claimed. The check letter only decides whether a string is worth asking the
 * database about. Never treat a valid check letter as proof of anything.
 *
 * ---------------------------------------------------------------------------
 * THE FORMAT — 11 characters
 * ---------------------------------------------------------------------------
 *
 *     I R Z   T 6   X   A   0 0 1   D
 *     └─┬─┘   └┬┘   │   │   └─┬─┘   │
 *    product  year month batch unit check
 *      (3)     (2)  (1)   (1)   (3)  (1)
 *
 *   product  three letters, 'IRZ' today
 *   year     the literal 'T' followed by one year digit
 *   month    1-9 for Jan-Sep, then X, Y, Z for Oct, Nov, Dec — because a
 *            two-digit month would have cost a character and '10'-'12' are
 *            the only ones that need one
 *   batch    one letter
 *   unit     three digits within the batch
 *   check    one letter from CHK below, derived from the other ten
 */

/**
 * The value alphabet: every character that can appear in the first ten
 * positions, and the position in this string IS the character's numeric
 * value. Digits are 0-9 by construction, which is the point of starting with
 * them.
 */
const FULL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * The check alphabet. 23 letters, and the three that are missing are missing
 * on purpose: I, O and Q are the letters people read as 1, 0 and O. A check
 * letter exists to catch a misreading, so it must not be a character that
 * invites one.
 *
 * 23 is prime, which is why a transposition of adjacent characters and almost
 * every single-character substitution change the result.
 *
 * ALMOST. The one family this cannot catch, stated plainly rather than left
 * for someone to discover: substituting a character for one whose VALUE is
 * exactly 23 away — 0↔N, 1↔O, 4↔R, 6↔T, A↔X, C↔Z — leaves the sum unchanged
 * mod 23, so the serial still validates. It is nine such pairs per serial and
 * it is inherent to any mod-23 weighted sum over a 36-symbol alphabet, not a
 * defect in this transcription.
 *
 * It does not matter, and `scripts/test-club-serial.mjs` asserts exactly this
 * set so that it stays known rather than becoming a surprise. None of those
 * pairs is a misreading a human makes off a sticker — the ones that are
 * (0/O, 1/I, 5/S, 8/B) all have small deltas and are caught. And an
 * undetectable typo still fails: it produces a well-formed serial that is not
 * in `club_serials`, so the lookup returns NOT_FOUND. The database is the
 * gate; this is the doormat.
 */
const CHK = 'ABCDEFGHJKLMNPRSTUVWXYZ';

/** How long a complete serial is, check letter included. */
export const SERIAL_LENGTH = 11;

/** How long the part the check letter is computed over is. */
const PAYLOAD_LENGTH = 10;

/**
 * An example in the shape of the real thing, for a placeholder and for the
 * "where do I find this" copy. Its check letter is correct, so it is a
 * serial that would be REJECTED at the database rather than at the form —
 * which is the right failure for an example: nobody should be able to join
 * by typing the one printed on the website.
 */
export const SERIAL_EXAMPLE = 'IRZT6XA001D';

/**
 * Tidy what someone actually typed into what the algorithm expects.
 *
 * Case-insensitive, and spaces and dashes are thrown away — people group
 * eleven characters to keep their place ("IRZ-T6X-A001-D", "irz t6x a001 d")
 * and refusing that is refusing a correct serial over punctuation. Every
 * other character is left alone so it can be rejected by `isValidSerial`
 * rather than silently stripped into something valid.
 */
export function normalizeSerial(raw) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

/**
 * The check letter for the first ten characters of a serial.
 *
 * ===========================================================================
 * DO NOT "SIMPLIFY" THIS. It is a transcription, and the weights are 1..10.
 * ===========================================================================
 * A position-weighted sum modulo 23. The weight is `i + 1`, so the FIRST
 * character counts once and the LAST of the ten counts ten times — weighting
 * by `i` instead (first character counts zero) produces a different letter
 * for every serial, and an earlier draft of this module did exactly that.
 * Changing it silently invalidates every carton already printed.
 *
 * Returns null if any character is outside FULL, which is how a serial
 * containing a space, a lowercase letter that was not normalised, or a
 * punctuation mark reaches `isValidSerial` as false rather than as a crash.
 */
export function checkLetter(firstTen) {
  const payload = String(firstTen ?? '');
  if (payload.length !== PAYLOAD_LENGTH) return null;

  let sum = 0;
  for (let i = 0; i < PAYLOAD_LENGTH; i += 1) {
    const value = FULL.indexOf(payload[i]);
    if (value === -1) return null;
    sum += (i + 1) * value;
  }

  return CHK[sum % CHK.length];
}

/**
 * Is this a well-formed serial? Length, alphabet, and the check letter.
 *
 * Takes RAW input and normalises it itself, so no caller can forget to — the
 * browser form, the route handler and the test all pass whatever they were
 * given. `true` means "worth asking the database about", and nothing more:
 * see the note at the top of this file.
 */
export function isValidSerial(raw) {
  const serial = normalizeSerial(raw);
  if (serial.length !== SERIAL_LENGTH) return false;

  const expected = checkLetter(serial.slice(0, PAYLOAD_LENGTH));
  if (expected === null) return false;

  return serial[PAYLOAD_LENGTH] === expected;
}

/**
 * The normalised serial if it is valid, otherwise null.
 *
 * The form the rest of the system uses: it validates and canonicalises in one
 * step, so a route handler cannot validate one string and then store a
 * differently-cased one. `club_serials.serial` is the primary key, so a
 * lowercase row and an uppercase row would be two different serials.
 */
export function parseSerial(raw) {
  const serial = normalizeSerial(raw);
  return isValidSerial(serial) ? serial : null;
}

/**
 * "IRZT6XA••1D" — a serial a member can RECOGNISE but a shoulder cannot COPY.
 *
 * The two-step join shows this on a chip at the top of step two, so someone
 * filling in their details can see which unit they are registering without
 * the full eleven characters sitting on screen in a café. Seven characters
 * at the front and two at the back is enough to recognise your own box;
 * the two it hides are inside the batch-and-unit block, which is the part
 * that actually differs between units from the same run.
 *
 * NOT A SECURITY CONTROL. Anyone who can read the chip could have read the
 * field they just typed it into. It is the same courtesy a bank statement
 * extends by printing four digits of a card number.
 *
 * Anything that is not a full-length serial is returned normalised and
 * unmasked — there is nothing to hide in a string that is not a serial, and
 * silently masking one would make a debugging session very confusing.
 */
export function maskSerial(raw) {
  const serial = normalizeSerial(raw);
  if (serial.length !== SERIAL_LENGTH) return serial;
  return `${serial.slice(0, 7)}••${serial.slice(9)}`;
}
