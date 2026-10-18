'use client';

import { Minus, Plus } from 'lucide-react';

/**
 * A quantity control, built as two buttons around a NUMBER INPUT rather than
 * around a <span>.
 *
 * The span version is the common one and it is wrong for anyone ordering
 * five: it makes the only way to reach 5 four taps, and it gives a screen
 * reader nothing to announce the current value as. A real input can be
 * typed into, selected, and read out by its label.
 *
 * `inputMode="numeric"` brings up the number pad on a phone without
 * `type="number"`'s spinner arrows, which would sit beside our own +/- and
 * give the control two different ways to do the same thing.
 *
 * Both buttons are 44x44 — the floor for a thumb — and stay that size at
 * every breakpoint. The disabled states are real `disabled` attributes, so
 * the keyboard skips them rather than letting someone tab to a control that
 * silently does nothing at the limit.
 */
export default function QuantityStepper({ value, onChange, min = 1, max = 10, idPrefix = 'qty' }) {
  const id = `${idPrefix}-input`;
  const clamp = (n) => Math.max(min, Math.min(max, n));

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-step-1 font-semibold uppercase tracking-[0.18em] text-ink-3">
        Qty
      </label>

      <div className="flex items-center rounded-full border border-border-subtle bg-white/[0.04]">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label="Decrease quantity"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
        >
          <Minus size={16} aria-hidden="true" />
        </button>

        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value.replace(/[^0-9]/g, ''));
            if (Number.isFinite(next) && next > 0) onChange(clamp(next));
          }}
          aria-label="Quantity"
          className="w-10 border-0 bg-transparent text-center text-step-2 font-semibold text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
        />

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label="Increase quantity"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
