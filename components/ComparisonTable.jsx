'use client';

import Reveal from './Reveal';
import { COMPARISON } from '@/lib/iriz';

const DEFAULT_COLUMNS = COMPARISON.columns;
const DEFAULT_ROWS = COMPARISON.rows;

function Cell({ value }) {
  if (value === true) {
    return (
      // A plain svg, and a tick that is DRAWN in the server HTML.
      //
      // This was a framer-motion svg with `initial={{ pathLength: 0,
      // opacity: 0 }}`, which React serialised as an inline `opacity:0` on
      // every tick in the table — so with no bundle the whole "IRIZ has it"
      // column rendered blank, which is worse than no table at all: it reads
      // as a feature the product does not have. Its viewport amount was 0.8
      // on top of that, a fraction nothing this small reliably satisfies.
      //
      // The draw-on is now the `.tick-path` rule in app/globals.css, keyed
      // off the enclosing <Reveal>'s data-reveal-in and gated behind
      // html.js-anim like every other animation on the site. Without the
      // class the path is simply a finished tick.
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-soft">
        <path
          className="tick-path"
          d="M2.5 8.5L6 12l7.5-8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (value === false) {
    return <span className="text-white/50">—</span>;
  }
  return <span className="text-white/75">{value}</span>;
}

export default function ComparisonTable({
  eyebrow = 'IRIZ vs. The Rest',
  heading = 'Not all "500 lumens" are the same.',
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  showViewMore = true,
}) {
  return (
    <section id="compare" className="border-b border-border-subtle bg-black py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="mb-10">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">{heading}</h2>
        </Reveal>

        <Reveal delay={0.1} className="glass-panel overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="p-5 font-medium text-white/50">&nbsp;</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`p-5 font-semibold ${col.highlight ? 'text-white' : 'text-white/70'}`}
                  >
                    {col.highlight && (
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-accent-soft">
                        Most Popular
                      </span>
                    )}
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={`transition-colors duration-200 hover:bg-accent-soft/[0.06] ${i % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
                >
                  <td className="border-t border-border-subtle p-5 text-white/50">{row.label}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="border-t border-border-subtle p-5">
                      <Cell value={row[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        {showViewMore && (
          <Reveal delay={0.15} className="mt-8 text-center">
            <a
              href="/compare"
              className="text-sm font-semibold text-accent-soft underline-offset-4 hover:underline"
            >
              See the full comparison →
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}
