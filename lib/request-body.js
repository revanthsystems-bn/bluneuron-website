/**
 * Read a JSON request body with a HARD byte cap, enforced while reading.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT JUST CHECK content-length
 * ---------------------------------------------------------------------------
 * Both warranty routes used to cap the body by reading `content-length` and
 * refusing anything over 10 KB. That check is worth keeping — it is one
 * header lookup and it rejects an oversized body before a byte of it is
 * read — but it is not a cap, because the header is optional. A request sent
 * with `Transfer-Encoding: chunked` (or HTTP/2, where framing replaces the
 * header entirely) carries NO content-length, `Number(null)` is `NaN`,
 * `Number.isFinite(NaN)` is false, and the check waved it through. The next
 * line was `await request.json()`, which buffers however much the client
 * decides to send. The cap was advisory to anyone who did not want it.
 *
 * So the bytes are counted as they arrive and the read is abandoned the
 * moment the total passes `maxBytes`. The caller gets a 413 and nothing
 * larger than the cap is ever held in memory.
 *
 * ---------------------------------------------------------------------------
 * HOST-INDEPENDENT ON PURPOSE
 * ---------------------------------------------------------------------------
 * This is the Web Streams API — `request.body.getReader()` and
 * `TextDecoder` — not `node:stream`. Route handlers receive a Web `Request`
 * on all three of this site's hosts, so the same code runs on Cloudflare
 * Workers (which has no `node:stream` unless asked), on Vercel and on the
 * GoDaddy Node host. See the runtime note at the top of
 * app/api/warranty-registration/route.js.
 *
 * `reader.cancel()` on the oversize path matters: it tells the runtime to
 * stop pulling the rest of the upload rather than leaving a producer writing
 * into a stream nobody is draining.
 */

/**
 * @param {Request} request
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, value: unknown } | { ok: false, status: 413 | 400 }>}
 *
 * `status` is all the caller gets back on failure, because the message
 * belongs to the route: "the claim form is too large" and "the registration
 * form is too large" are the same condition worded for two different forms.
 */
export async function readJsonBody(request, maxBytes) {
  // The cheap rejection first: an honest oversized request announces itself
  // and can be refused without reading anything.
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413 };
  }

  let text;
  try {
    text = await readCappedText(request, maxBytes);
  } catch {
    // A truncated or aborted upload. Not oversize, just unusable.
    return { ok: false, status: 400 };
  }

  if (text === TOO_LARGE) return { ok: false, status: 413 };
  if (text === null) return { ok: false, status: 400 };

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/** Sentinel, so "over the cap" is distinguishable from "an empty body". */
const TOO_LARGE = Symbol('body-too-large');

/**
 * The whole body as text, or TOO_LARGE, or null when there is no body.
 *
 * The decoder is fed chunk by chunk with `{ stream: true }` so a multi-byte
 * UTF-8 character split across a chunk boundary is reassembled rather than
 * turned into a replacement character — a name with an accent in it is split
 * exactly that way often enough to matter.
 */
async function readCappedText(request, maxBytes) {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let total = 0;
  let text = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      // `value` is a Uint8Array. The cap is on BYTES, not characters: a
      // character limit would let a body of multi-byte characters use
      // several times the memory the cap was written to bound.
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return TOO_LARGE;
      }

      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  return text + decoder.decode();
}
