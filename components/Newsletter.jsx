'use client';

import { useState } from 'react';
import Reveal from './Reveal';
import Magnetic from './Magnetic';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-black py-20">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-noise" />
      <div className="section-container relative text-center">
        <Reveal>
          <p className="eyebrow mb-3">Stay Wired In</p>
          <h2 className="mx-auto max-w-lg text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            Get J500 updates first.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
            Join the BluNeuron list for firmware updates, availability alerts, and setup tips.
          </p>
        </Reveal>

        {submitted ? (
          <p className="mt-8 text-sm font-semibold text-accent-soft">You&apos;re on the list. Welcome to BluNeuron.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full flex-1 rounded-full border border-border bg-white/[0.04] px-5 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-glass focus:border-white/30"
            />
            <Magnetic as="button" type="submit" className="btn-primary whitespace-nowrap">
              Notify Me
            </Magnetic>
          </form>
        )}
      </div>
    </section>
  );
}
