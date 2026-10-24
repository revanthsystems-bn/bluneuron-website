import { BookOpen, FileText, HelpCircle, Mail, ShieldCheck, Wrench } from 'lucide-react';
import Reveal from './Reveal';
import { SUPPORT_TILES } from '@/lib/routes';

/**
 * The support hub's cards.
 *
 * TWO GROUPS, NOT ONE ROW OF SIX. The two warranty actions lead and the rest
 * follow, driven by `lead` in SUPPORT_TILES (lib/routes.js) — see the note
 * there for why. Six tiles of identical weight made the hub read as a
 * sitemap and left the reader to work out which one was theirs.
 *
 * THE WHOLE CARD IS THE TARGET. The anchor fills the tile and the arrow is a
 * cue inside it, not a separate control — the previous markup had a 20px
 * "→" glyph that looked like the thing to press.
 */
const ICONS = {
  shield: ShieldCheck,
  wrench: Wrench,
  question: HelpCircle,
  book: BookOpen,
  mail: Mail,
  document: FileText,
};

function Tile({ tile, index }) {
  const Icon = ICONS[tile.icon] ?? FileText;

  return (
    <Reveal as="li" y={20} delay={Math.min(index, 3) * 0.05} className="h-full">
      <a
        href={tile.href}
        className={[
          'group relative flex h-full flex-col rounded-3xl border border-border-subtle p-6 sm:p-7',
          'transition-all duration-500 hover:-translate-y-1 hover:border-white/20',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft',
          // The lead pair carry a faint accent wash so the difference reads
          // as emphasis rather than as two unrelated card styles.
          tile.lead
            ? 'bg-[linear-gradient(135deg,rgba(59,130,246,0.10),rgba(59,130,246,0)_58%)] bg-black-surface/60 hover:bg-white/[0.05]'
            : 'bg-black-surface/50 hover:bg-white/[0.045]',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-[13px] border border-accent-soft/25 bg-accent/10 text-accent-soft transition-colors duration-500 group-hover:border-accent-soft/45"
        >
          <Icon className="h-[21px] w-[21px]" />
        </span>

        <h3 className="text-[17px] font-semibold tracking-tight text-white">{tile.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{tile.body}</p>

        {/* `mt-auto` pins the cue to the bottom edge, so tiles with one line
            of body and tiles with three still line their arrows up. */}
        <span className="mt-auto flex items-center gap-2 pt-5 text-[13px] font-semibold text-accent-soft">
          {tile.cta || 'Open'}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </Reveal>
  );
}

export default function SupportTiles() {
  const lead = SUPPORT_TILES.filter((t) => t.lead);
  const rest = SUPPORT_TILES.filter((t) => !t.lead);

  return (
    <div className="space-y-12">
      <div>
        {/* REAL HEADINGS. These were styled paragraphs, which left the
            tiles’ <h3>s with no <h2> above them and broke the document
            outline — axe reports it as heading-order. */}
        <h2 className="eyebrow mb-4">Your warranty</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {lead.map((tile, i) => (
            <Tile key={tile.href} tile={tile} index={i} />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="eyebrow mb-4">Answers &amp; documents</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((tile, i) => (
            <Tile key={tile.href} tile={tile} index={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
