'use client';

import { usePathname } from 'next/navigation';
import { ACCOUNT_NAV } from '@/lib/routes';

/**
 * The account area's section nav.
 *
 * TWO SHAPES, ONE LIST. At lg it is a vertical rail beside the content,
 * which is what an account area wants: the sections are peers, the list is
 * short, and a rail leaves the content column its full measure. Below lg it
 * becomes a horizontally scrolling row of pills — not a `<select>`, and not
 * a burger. A select hides where you are until you open it, and these four
 * labels are the entire map of the area.
 *
 * `.bleed-x` on the scroller is the trick that lets the row bleed to the
 * screen edge inside a padded container, so the last pill is visibly cut off
 * rather than ending flush — which is what tells a thumb there is more to
 * the right. `[scrollbar-width:none]` hides the bar on the platforms that
 * would draw one over the pills.
 */
export default function AccountNav() {
  const pathname = usePathname();
  const isCurrent = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <nav aria-label="Account sections">
      <ul className="bleed-x flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {ACCOUNT_NAV.map((item) => {
          const current = isCurrent(item);
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <a
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-full px-4 py-2.5 text-step-2 font-medium transition-colors lg:rounded-ctl lg:whitespace-normal ${
                  current
                    ? 'bg-white/10 text-white'
                    : 'text-ink-3 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
