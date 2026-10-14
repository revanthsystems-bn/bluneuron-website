import { BookOpen, FileText, HelpCircle, Mail, ShieldCheck, Wrench } from 'lucide-react';
import Reveal from './Reveal';
import { SUPPORT_TILES } from '@/lib/routes';

/**
 * The support hub's tiles (app/support).
 *
 * Content, order and destinations come from SUPPORT_TILES in lib/routes.js —
 * this file is only how they look. The registry names an icon abstractly
 * ('shield', 'wrench') and the mapping to an actual glyph lives here, so the
 * route registry stays free of component imports and a swapped icon set is one
 * edit in one file.
 *
 * WHOLE TILE IS THE LINK, not a "Learn more" inside it. On a phone these are
 * the primary navigation of the support section, and a 44px text link inside a
 * 160px card wastes the other 90% of the target. `<a>` wrapping the content
 * also means one tab stop per tile rather than two.
 *
 * Icons are lucide-react, the same source as components/TrustBadges, and all
 * are `aria-hidden` — each tile's heading already says what it is, so an
 * announced icon would just repeat it. No emoji: they render differently on
 * every platform and read as decoration a screen reader has to spell out.
 */
const ICONS = {
  shield: ShieldCheck,
  wrench: Wrench,
  question: HelpCircle,
  book: BookOpen,
  mail: Mail,
  document: FileText,
};

export default function SupportTiles() {
  return (
    <ul className="bento-grid">
      {SUPPORT_TILES.map((tile, i) => {
        const Icon = ICONS[tile.icon] ?? FileText;

        return (
          <Reveal
            key={tile.href}
            as="li"
            y={20}
            delay={Math.min(i, 3) * 0.05}
            className="bento-tile lg:col-span-4"
          >
            <a
              href={tile.href}
              className="flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>

              <h3 className="text-base font-semibold text-white">{tile.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{tile.body}</p>

              {/* `mt-auto` pins the cue to the bottom edge, so tiles with one
                  line of body and tiles with three still line their arrows up
                  across the row. */}
              <span
                className="mt-auto pt-5 text-sm font-medium text-white/70"
                aria-hidden="true"
              >
                →
              </span>
            </a>
          </Reveal>
        );
      })}
    </ul>
  );
}
