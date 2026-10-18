'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useScroll, useSpring } from 'framer-motion';
import Magnetic from './Magnetic';
import AccountButton from './account/AccountButton';
import CartButton from './cart/CartButton';
import NotifyButton from './NotifyButton';
import { useCart } from './cart/CartContext';
import { runBuyNow } from '@/lib/commerce';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { NAV_ITEMS, ROUTES } from '@/lib/routes';
import BuyButton from '@/components/buy/BuyButton';
import { SHOW_BUY } from '@/lib/site-config';
import { NOTIFY_SOURCES } from '@/lib/web3forms';

/**
 * NAV_ITEMS now comes from lib/routes.js rather than being declared here.
 *
 * It used to be four on-page anchors plus /specs — a masthead for a one-page
 * teaser, where "Overview" and "Highlights" were scroll targets on the
 * homepage and did nothing from anywhere else. With a shop, a product page
 * and an account area, the masthead has to navigate the SITE, so the list
 * lives in the registry beside the paths it points at and cannot name a
 * route that does not exist.
 */

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
  const pathname = usePathname();
  const handleBuyNow = () => runBuyNow({ addItem, router });

  /**
   * Which nav item is the page you are on.
   *
   * `exact` for /shop, because /shop/iriz is its own entry: without it both
   * would light up on the product page and the highlight would stop meaning
   * "you are here". Everything else matches on prefix so a future
   * /support/faq still marks "Support".
   */
  const isCurrent = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

  /**
   * THE MASTHEAD CTA — one function, two call sites (the bar and the open
   * mobile panel), so the two can never offer different actions.
   *
   * Three states, in priority order:
   *
   *   SHOW_BUY          "Buy", which opens the "choose where to buy" sheet
   *                     (components/buy). It used to be an <a> to the
   *                     homepage's buy card, which worked on the homepage
   *                     and was a cross-page jump from everywhere else —
   *                     press Buy on a policy page and you landed on / and
   *                     had to find the card. The sheet answers the
   *                     question where it is asked, with the price and the
   *                     fulfilment note in it.
   *   COMMERCE_ENABLED  the old in-site "Buy Now". Dead today (that flag is
   *                     false, see lib/launch.js) and kept intact rather than
   *                     deleted, so the in-site cart path still works if it is
   *                     ever switched back on.
   *   neither           "Notify Me", the launch-list modal. The pre-launch
   *                     state, unchanged.
   *
   * SHOW_BUY wins over COMMERCE_ENABLED deliberately: marketplace selling is
   * the real purchase path now, so if both were ever on, the masthead must
   * send people to the marketplaces rather than to the dummy checkout.
   *
   * A <button> for the buy state, not an <a>: it opens a dialog on the
   * current page and navigates nowhere, so there is no URL to middle-click
   * or copy. BuyButton carries the aria-haspopup that says so.
   */
  const renderCta = (className, { onNavigate, strength = 0.15 } = {}) => {
    if (SHOW_BUY) {
      return (
        <BuyButton
          className={className}
          onClick={onNavigate}
        />
      );
    }

    if (COMMERCE_ENABLED) {
      return (
        <Magnetic
          as="button"
          type="button"
          onClick={() => {
            onNavigate?.();
            handleBuyNow();
          }}
          className={className}
          strength={strength}
        >
          Buy Now
        </Magnetic>
      );
    }

    return (
      <NotifyButton
        source={onNavigate ? NOTIFY_SOURCES.mobileMenu : NOTIFY_SOURCES.masthead}
        className={className}
        strength={strength}
        onClick={onNavigate}
      />
    );
  };

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
          {NAV_ITEMS.map((item) => {
            const current = isCurrent(item);
            return (
              <a
                key={item.label}
                href={item.href}
                // `aria-current="page"` is the half of the active state that
                // is not a colour. The tint below is invisible to a screen
                // reader and, at this contrast, easy to miss at a glance;
                // this is what actually announces "you are here".
                aria-current={current ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-step-2 font-medium transition-colors duration-500 ${
                  ink
                    ? current
                      ? 'bg-black/[0.06] text-black-obsidian'
                      : 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
                    : current
                      ? 'bg-white/10 text-white'
                      : frosted
                        ? 'text-white hover:bg-white/10'
                        : 'text-ink-2 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* THE ICON CLUSTER, in the order a shopper reaches for it: identity,
            then basket, then the CTA. `gap-1` between the two icon buttons
            rather than `gap-3` — they are both 40px hit targets with their
            own padding, and a wider gap reads as two unrelated controls
            instead of one account/cart pair. */}
        <div className="flex items-center gap-1 sm:gap-2">
          <AccountButton ink={ink} />
          <CartButton ink={ink} />
          {renderCta(
            `ml-1 hidden px-5 py-2.5 text-step-1 sm:inline-flex ${ink ? 'btn-primary-ink' : 'btn-primary'}`
          )}
          <button
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500 lg:hidden ${
              ink
                ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
                : frosted
                  ? 'text-white hover:bg-white/10'
                  : 'text-ink-2 hover:bg-white/5 hover:text-white'
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
            {NAV_ITEMS.map((item) => {
              const current = isCurrent(item);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={current ? 'page' : undefined}
                  // `py-3` on a full-width row is a ~44px target, which is
                  // the floor for a thumb. Do not tighten it to match the
                  // desktop nav's `py-2`.
                  className={`rounded-lg px-3 py-3 text-step-2 font-medium ${
                    ink
                      ? current
                        ? 'bg-black/[0.06] text-black-obsidian'
                        : 'text-black-obsidian/80 hover:bg-black/5 hover:text-black-obsidian'
                      : current
                        ? 'bg-white/10 text-white'
                        : 'text-ink-2 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            {/* The account link is an ICON in the bar and a named row here.
                An icon alone is ambiguous at the best of times, and in an
                open menu there is room to say the word. */}
            <a
              href={ROUTES.account}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-3 text-step-2 font-medium ${
                ink
                  ? 'text-black-obsidian/80 hover:bg-black/5 hover:text-black-obsidian'
                  : 'text-ink-2 hover:bg-white/5 hover:text-white'
              }`}
            >
              Account
            </a>
            {renderCta(`mt-2 justify-center ${ink ? 'btn-primary-ink' : 'btn-primary'}`, {
              // Closing the panel is the shared part: tapping the CTA inside
              // an open mobile menu must dismiss it, whichever of the three
              // actions the CTA currently is.
              onNavigate: () => setMobileOpen(false),
              strength: 0,
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
