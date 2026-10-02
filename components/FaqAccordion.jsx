'use client';

import { useState } from 'react';
import Reveal from './Reveal';

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="divide-y divide-border-subtle glass-panel">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;

        return (
          <Reveal key={item.q} delay={i * 0.03} as="div">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-soft sm:px-8"
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-xl text-white/40 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="px-6 pb-5 text-sm leading-relaxed text-white/60 sm:px-8"
            >
              {item.a}
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
