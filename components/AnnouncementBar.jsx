import { announcementText } from '@/lib/site-config';

/**
 * The thin line above the masthead, on every page but the homepage — whose
 * cinematic hero has to be the first thing in the viewport (see app/page.jsx).
 *
 * The copy is NOT written here. It comes from ANNOUNCEMENT in
 * lib/site-config.js and switches with SHOW_BUY, so launch day is one
 * constant and the bar cannot be left advertising a launch list after the
 * product is on sale. See the note on ANNOUNCEMENT for why the old line —
 * a restatement of the spec sheet — was not worth a bar on every page.
 *
 * Still a server component with no state: one string, resolved at build.
 */
export default function AnnouncementBar() {
  return (
    <div className="w-full border-b border-border-subtle bg-black py-2 text-center">
      {/* `px-4` so the sentence never touches the edge at 390px, where this
          line wraps to two rows. */}
      <p className="px-4 text-xs font-medium tracking-wide text-white/70">{announcementText()}</p>
    </div>
  );
}
