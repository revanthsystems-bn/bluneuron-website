import { DEMO_MODE } from '@/lib/account-demo';

/**
 * "This is demo data" — on every account surface, without exception.
 *
 * The rule it enforces: nobody, looking at a screenshot or at the running
 * site, should be able to mistake a fixture for a real record. An account
 * area is the worst place in a site to get that wrong — a plausible order
 * someone did not place is alarming, and a plausible address is worse.
 *
 * Renders nothing once Supabase is configured, so it cannot be left behind
 * on a real deployment. Amber rather than red: this is an editorial state,
 * not an error, which is the same call components/DraftBanner makes.
 */
export default function DemoNotice({ className = '' }) {
  if (!DEMO_MODE) return null;

  return (
    <div
      role="note"
      className={`rounded-ctl border border-amber-400/30 bg-amber-400/10 p-5 ${className}`}
    >
      <p className="text-step-2 font-semibold text-amber-300">Demo data — not a real account.</p>
      <p className="mt-1.5 text-step-2 leading-relaxed text-amber-200/70">
        No account system is connected yet. Everything on this page is placeholder content so the
        screens can be designed and reviewed. Nothing here is stored, sent, or linked to anyone.
      </p>
    </div>
  );
}
