import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import Reveal from './Reveal';
import { TRUST_BADGES } from '@/lib/j500';

const ICONS = { truck: Truck, shield: ShieldCheck, returns: RotateCcw, support: Headphones };

export default function TrustBadges() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-black py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(0,180,255,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="section-container relative">
        <p className="eyebrow mb-8 text-center">Why Shop BluNeuron</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((b, i) => {
            const Icon = ICONS[b.icon];
            return (
              <Reveal
                key={b.title}
                delay={i * 0.07}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_24px_48px_-24px_rgba(34,211,238,0.4)]"
              >
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-cyan-400/25 blur-xl transition-all duration-300 group-hover:bg-cyan-400/45" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    {Icon && <Icon className="h-5 w-5 text-cyan-300" strokeWidth={1.75} />}
                  </span>
                </div>
                <p className="text-base font-semibold text-white">{b.title}</p>
                <p className="mt-1.5 text-sm text-white/55">{b.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
