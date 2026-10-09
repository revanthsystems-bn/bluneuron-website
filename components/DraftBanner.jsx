import { isDraftRoute } from '@/lib/routes';

/**
 * "This page is a draft" — the visible half of the draft state.
 *
 * Renders NOTHING unless `lib/routes.js` says this route still quotes a
 * placeholder, so a page cannot be left wearing a stale banner after its
 * details are filled in, and cannot lose one while it still needs it. The
 * invisible half — the `noindex` — comes from `routeRobots()` reading the same
 * table, which is why neither is a prop a page could get wrong.
 *
 * Amber rather than red: this is an editorial state, not an error. It sits at
 * the top of the content, above the first heading, because the one thing it
 * has to do is reach a reader before they act on a number that is not final
 * yet.
 *
 * `role="note"` rather than `role="alert"`: an alert interrupts a screen
 * reader mid-sentence, which is for something that just went wrong, not for a
 * standing caveat about the page you have only now begun reading.
 */
export default function DraftBanner({ path, className = '' }) {
  if (!isDraftRoute(path)) return null;

  return (
    <div
      role="note"
      className={`rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 ${className}`}
    >
      <p className="text-sm font-semibold text-amber-300">
        Draft — this page is not final.
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-200/70">
        Anything marked <span className="font-semibold">[TBD]</span> is still being confirmed and
        must not be relied on. The finished version replaces every placeholder on this page.
      </p>
    </div>
  );
}
