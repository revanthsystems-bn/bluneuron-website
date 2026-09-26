'use client';

import { useState } from 'react';
import Image from 'next/image';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#showcase' },
      { label: 'Highlights', href: '#highlights' },
      { label: 'Full Specs', href: '#specs' },
      { label: 'J500 vs. Others', href: '#compare' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Setup Guide', href: '#' },
      { label: 'Datasheet (PDF)', href: '#' },
      { label: 'Firmware Updates', href: '#' },
      { label: 'Contact Support', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About BluNeuron', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Shipping Policy', href: '#' },
      { label: 'Returns', href: '#' },
    ],
  },
];

const REGIONS = ['United States', 'Canada', 'United Kingdom', 'European Union', 'Australia'];

export default function Footer() {
  const [region, setRegion] = useState(REGIONS[0]);

  return (
    <footer className="bg-black">
      <div className="section-container py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-border-subtle pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Image src="/brand/logo-mark.png" alt="" width={24} height={24} className="h-6 w-auto" />
            <Image
              src="/brand/wordmark-white.png"
              alt="BluNeuron"
              width={1715}
              height={327}
              className="h-4 w-auto"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="sr-only" htmlFor="region-select">
              Region
            </label>
            <select
              id="region-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-full border border-border-subtle bg-white/[0.03] px-4 py-2 text-xs text-white/70 outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r} className="bg-black">
                  {r}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              {['X', 'IG', 'YT'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-[10px] font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-white/30">
          © {new Date().getFullYear()} BluNeuron. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
