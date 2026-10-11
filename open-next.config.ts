/**
 * OpenNext configuration for the Cloudflare Workers build.
 *
 * The filename is fixed — `opennextjs-cloudflare` looks for
 * `open-next.config.ts` by name and compiles it with esbuild, which is why
 * this is TypeScript in a project that has no `typescript` dependency. It is
 * never type-checked and never reaches `next build`; Next's TypeScript
 * detection only scans app/, pages/ and src/, so a root-level .ts file does
 * not flip the Next build into TypeScript mode. (Verified: `npm run build`
 * still runs clean with this file present.)
 *
 * ---------------------------------------------------------------------------
 * WHY THE CACHE IS STATIC ASSETS AND NOT R2
 * ---------------------------------------------------------------------------
 * OpenNext's get-started page configures `r2IncrementalCache`, which is the
 * right default for an app that revalidates pages at runtime. This site does
 * not. Every route here is prerendered at build time except `/`, which reads
 * `searchParams` for the `?hero=` theme override and is therefore server
 * rendered on every request — and plain SSR needs no cache override at all.
 *
 * So the cache is the build output itself: `staticAssetsIncrementalCache`
 * reads prerendered pages straight out of the uploaded assets. It is
 * read-only — `revalidate`, `revalidatePath` and `res.revalidate` do NOT
 * work with it — and that is an accurate description of this site, where new
 * content arrives by rebuilding and redeploying.
 *
 * It also costs nothing and adds no infrastructure: no R2 bucket, no KV
 * namespace, no queue, and no WORKER_SELF_REFERENCE service binding (that
 * one exists to let the Worker call itself for queued revalidation, which
 * there is none of here).
 *
 * IF ISR IS EVER ADDED — an `export const revalidate = 3600`, or a route
 * handler calling `revalidatePath` — this override silently will not honour
 * it: the page will serve the build-time copy forever, with no error. Switch
 * to `r2IncrementalCache`, add the R2 bucket and the queue, and read
 * https://opennext.js.org/cloudflare/caching first.
 */
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
