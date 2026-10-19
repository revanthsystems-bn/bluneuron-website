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
 * THE `ink` / LIGHT-HERO TEST IS GONE, along with lib/heroTheme.js.
 *
 * It existed for one reason: the hero backdrop was bright white studio
 * footage, and dark ink over white footage was a real alternative worth
 * testing. The hero is now a product on a DARK stage (components/HeroBackdrop
 * has the reasoning), so dark ink over it fails AA by construction — the test
 * could only ever have shipped an unreadable masthead, and `?hero=light` was
 * a reachable URL that did exactly that.
 *
 * Removing it also took `searchParams` out of app/page.jsx, which is what put
 * the homepage back to being STATICALLY PRERENDERED instead of server-rendered
 * on every request.
 *
 * TWO INDEPENDENT FLAGS, still not one:
 *
 *   `scrolled`  (> 24px)  — the existing height/background shrink.
 *   `pastHero`            — whether the masthead has cleared the hero.
 *
 * `frosted` switches on `pastHero`, not on `scrolled`. Keying it to `scrolled`
 * would drop the full black glass bar onto the hero 24px into a 100svh
 * section.
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
export default function Header({ overlay = false }) {
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

  // Frosted mode: floating over the hero, which has not scrolled away yet.
  const frosted = overlay && !pastHero;

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

  // Over the hero the frost carries the bar; past it, the normal black
  // glass. There is no longer a state in which the masthead is fully
  // transparent — that was the light-hero test's, and it is gone.
  const transparent = false;

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
          {/* ONE wordmark file now. There used to be two — white and ink —
              stacked and cross-faded, because the light-hero test needed a
              dark mark while the masthead floated over white footage. With
              that test gone the masthead is light-on-dark everywhere, and the
              second copy was a second request and a second DOM node for a
              state that can no longer occur. `wordmark-ink.png` is left in
              public/brand/ for whoever needs it next.

              `priority`, so the mark is preloaded and painted with the first
              frame rather than lazily after it. */}
          <Image
            src="/brand/wordmark-white.png"
            alt="BluNeuron"
            width={1715}
            height={327}
            priority
            className="h-5 w-auto"
          />
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
                  current
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
          <AccountButton />
          <CartButton />
          {renderCta('ml-1 hidden px-5 py-2.5 text-step-1 sm:inline-flex btn-primary')}
          <button
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500 lg:hidden ${
              frosted
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

      {/* The open mobile panel is a solid sheet. It used to flip to white in
          ink mode, over the light hero; with that test gone it is always the
          dark sheet. */}
      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-border-subtle bg-black lg:hidden">
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
                    current
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
              className="rounded-lg px-3 py-3 text-step-2 font-medium text-ink-2 hover:bg-white/5 hover:text-white"
            >
              Account
            </a>
            {renderCta('mt-2 justify-center btn-primary', {
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
