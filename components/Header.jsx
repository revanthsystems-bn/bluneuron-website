'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useSpring } from 'framer-motion';
import Magnetic from './Magnetic';
import CartButton from './cart/CartButton';
import NotifyButton from './NotifyButton';
import { useCart } from './cart/CartContext';
import { runBuyNow } from '@/lib/commerce';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { NOTIFY_SOURCES } from '@/lib/web3forms';

const NAV_ITEMS = [
  { label: 'Overview', href: '/#showcase' },
  { label: 'Highlights', href: '/#highlights' },
  { label: 'Specs', href: '/specs' },
  { label: 'Compare', href: '/compare' },
];

/**
 * `overlay` is for the homepage, where the cinematic hero runs full-bleed to
 * the top of the viewport. In that mode the masthead floats over the video —
 * fixed rather than sticky, so it claims no layout height.
 *
 * It used to float TRANSPARENT until the first scroll and let the hero's top
 * scrim carry the contrast. That worked only while a flat 0.42 veil darkened
 * the whole loop. The bright hero has no veil, so over the hero the bar now
 * wears its own frosted plate instead (`.hero-header-frost`): a dark wash
 * over blur(14px) saturate(1.2), which holds the logo, links and burger at AA
 * without putting any more darkness on the footage. The links and the burger
 * go FULL WHITE while they sit on it, and back to white/80 past the hero —
 * measured, see app/globals.css.
 *
 * ---------------------------------------------------------------------
 * `heroTheme` is the light-hero test (lib/heroTheme.js). With 'light', the
 * masthead has to be dark ink while it floats over the white hero, and go
 * back to its normal light-on-dark the moment the page reaches the dark
 * sections below.
 *
 * TWO INDEPENDENT FLAGS, not one:
 *
 *   `scrolled`  (> 24px)  — the existing height/background shrink.
 *   `pastHero`            — whether the masthead has cleared the hero.
 *
 * Both hero themes now switch their over-hero treatment on `pastHero`, not on
 * `scrolled`: `ink` for the light test, `frosted` for the bright dark hero.
 * Keying the frost to `scrolled` would drop the full black glass bar onto the
 * video 24px into a 100svh section.
 *
 * They used to be one flag, because with a dark hero "scrolled at all" and
 * "over something dark" were the same thing. Over a LIGHT hero they are not:
 * scrolling 25px inside the hero would otherwise drop a black glass bar onto
 * white footage. So in ink mode the background stays transparent until
 * `pastHero`, and only then does the dark glass fade in.
 *
 * `pastHero` is an IntersectionObserver on the hero's own box rather than a
 * scrollY threshold against `innerHeight` — the hero is `min-h-svh`, so its
 * real height moves with the mobile browser chrome and a hardcoded comparison
 * would fire at the wrong place on exactly the viewport that matters most.
 * Off the homepage there is no `#showcase`, the observer never attaches, and
 * `pastHero` stays at its `!overlay` initial value, which is the correct
 * resting state for a non-overlay masthead.
 *
 * The switch is a COLOR TRANSITION, not a remount: both states render the
 * same elements with the same classes and only the color/filter values
 * change, so `transition-colors` / `transition-[filter]` interpolate across
 * them. Nothing is conditionally mounted — a mount/unmount swap is exactly
 * what would make it flip hard.
 */
export default function Header({ overlay = false, heroTheme = 'dark' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(!overlay);
  const { addItem } = useCart();
  const router = useRouter();
  const handleBuyNow = () => runBuyNow({ addItem, router });

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 300, damping: 40 });

  // Ink mode: floating over a LIGHT hero that has not scrolled away yet.
  const ink = overlay && heroTheme === 'light' && !pastHero;
  // Frosted mode: the same moment on the BRIGHT dark hero. Mutually exclusive
  // with `ink` by construction — they test opposite values of `heroTheme`.
  const frosted = overlay && heroTheme !== 'light' && !pastHero;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!overlay) return undefined;
    const hero = document.getElementById('showcase');
    if (!hero) return undefined;

    // `-72px` is roughly the masthead's own height: the handover should happen
    // when the hero's bottom edge passes under the BAR, not under the viewport
    // top, or the ink would still be sitting on white for the bar's height.
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [overlay]);

  // Background: transparent only in ink mode, where the hero itself is white
  // and the bar is dark-on-light. Over the bright dark hero the frost carries
  // it; past either hero, the normal black glass.
  const transparent = ink;

  return (
    <header
      className={[
        'top-0 z-40 border-b transition-colors duration-500',
        overlay ? 'fixed inset-x-0' : 'sticky',
        transparent ? 'border-transparent bg-transparent' : 'border-border-subtle',
        // `border-border-subtle` is rgba(255,255,255,0.08) — the hairline the
        // frosted plate is specified with, and the same one the black glass
        // already used, so it is set once above for both.
        frosted ? 'hero-header-frost' : '',
        transparent || frosted
          ? ''
          : `backdrop-blur-glass ${scrolled ? 'bg-black/90' : 'bg-black/80'}`,
      ].join(' ')}
    >
      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 top-0 h-px origin-left bg-accent" />
      <div
        className={`section-container flex items-center justify-between transition-[height] duration-300 ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        <motion.a
          href="/"
          className="flex items-center"
          aria-label="BluNeuron home"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* TWO wordmark files, stacked and cross-faded on opacity.
              Not a CSS filter on the one asset: the mark is white glyphs plus
              one BRAND-BLUE word (rgb(2,109,254)), and `invert()` turns that
              blue orange while `brightness(0)` throws it away entirely.
              `wordmark-ink.png` is the same art with only the white
              recoloured to #030303, so the blue survives the handover.

              Stacked rather than swapped so the transition interpolates —
              swapping `src` would pop. The second copy is absolutely
              positioned and `aria-hidden`, so the accessibility tree still
              sees exactly one wordmark. */}
          <span className="relative inline-flex h-5">
            {/* `priority`, so the mark is preloaded and painted with the first
                frame rather than lazily after it. Over a bright hero a missing
                logo is not a subtle regression — there is no dark bar left for
                the gap to hide in. (It replaces a `preload` prop that was not
                a next/image prop at all and did nothing but reach the DOM.)
                Only the white copy gets it; the ink copy is for the light test
                and is never the first thing painted. */}
            <Image
              src="/brand/wordmark-white.png"
              alt="BluNeuron"
              width={1715}
              height={327}
              priority
              className={`h-5 w-auto transition-opacity duration-500 ${ink ? 'opacity-0' : 'opacity-100'}`}
            />
            <Image
              src="/brand/wordmark-ink.png"
              alt=""
              aria-hidden="true"
              width={1715}
              height={327}
              className={`absolute inset-0 h-5 w-auto transition-opacity duration-500 ${ink ? 'opacity-100' : 'opacity-0'}`}
            />
          </span>
        </motion.a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-500 ${
                ink
                  ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
                  : frosted
                    ? 'text-white hover:bg-white/10'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartButton ink={ink} />
          {COMMERCE_ENABLED ? (
            <Magnetic
              as="button"
              type="button"
              onClick={handleBuyNow}
              className={`hidden px-5 py-2.5 text-xs sm:inline-flex ${ink ? 'btn-primary-ink' : 'btn-primary'}`}
              strength={0.15}
            >
              Buy Now
            </Magnetic>
          ) : (
            <NotifyButton
              source={NOTIFY_SOURCES.masthead}
              className={`hidden px-5 py-2.5 text-xs sm:inline-flex ${ink ? 'btn-primary-ink' : 'btn-primary'}`}
            />
          )}
          <button
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className={`rounded-full p-2 transition-colors duration-500 lg:hidden ${
              ink
                ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
                : frosted
                  ? 'text-white hover:bg-white/10'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* The open mobile panel is a solid sheet, so in ink mode it has to go
          white — a black sheet under ink links would be unreadable, and
          keeping the links white on it would leave the bar above them dark. */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className={`border-t lg:hidden ${
            ink ? 'border-black/10 bg-white' : 'border-border-subtle bg-black'
          }`}
        >
          <nav className="section-container flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium ${
                  ink
                    ? 'text-black-obsidian/80 hover:bg-black/5 hover:text-black-obsidian'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
            {COMMERCE_ENABLED ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleBuyNow();
                }}
                className={`mt-2 justify-center ${ink ? 'btn-primary-ink' : 'btn-primary'}`}
              >
                Buy Now
              </button>
            ) : (
              <NotifyButton
                source={NOTIFY_SOURCES.mobileMenu}
                className={`mt-2 justify-center ${ink ? 'btn-primary-ink' : 'btn-primary'}`}
                strength={0}
                onClick={() => setMobileOpen(false)}
              />
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
