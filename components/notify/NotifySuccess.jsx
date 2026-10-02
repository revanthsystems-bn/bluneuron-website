'use client';

/**
 * The post-submit view. Only ever rendered after Web3Forms answered
 * `success: true` — see NotifyFields, which resolves `onSuccess` from nowhere
 * else.
 *
 * Shared by the modal and the inline form so the confirmation reads the same
 * either way. `onDone` is optional: the modal passes a close handler, the
 * inline form has nothing to close and omits it.
 */
export default function NotifySuccess({ onDone }) {
  return (
    <div className="flex flex-col items-center text-center" role="status">
      <div className="notify-check-ring">
        <svg
          className="notify-check"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#93b8fb"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4.5 12.5l5 5 10-10" />
        </svg>
      </div>

      <h3 className="type-display mt-6 text-[1.6rem] text-white">You&apos;re on the list.</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
        We&apos;ll email you the moment IRIZ launches. Keep an eye on your inbox.
      </p>

      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="mt-7 w-full rounded-[14px] border border-white/12 bg-white/[0.04] py-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Done
        </button>
      )}
    </div>
  );
}
