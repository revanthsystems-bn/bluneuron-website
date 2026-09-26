'use client';

import { motion } from 'framer-motion';
import Reveal from './Reveal';
import { COMPARISON } from '@/lib/j500';

const DEFAULT_COLUMNS = COMPARISON.columns;
const DEFAULT_ROWS = COMPARISON.rows;

function Cell({ value }) {
  if (value === true) {
    return (
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-accent-soft"
      >
        <motion.path d="M2.5 8.5L6 12l7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    );
  }
  if (value === false) {
    return <span className="text-white/25">—</span>;
  }
  return <span className="text-white/75">{value}</span>;
}

export default function ComparisonTable({
  eyebrow = 'J500 vs. The Rest',
  heading = 'Not all "500 lumens" are the same.',
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
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
      </div>
    </section>
  );
}
