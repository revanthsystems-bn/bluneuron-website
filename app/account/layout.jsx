import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import AccountGuard from '@/components/account/AccountGuard';
import AccountNav from '@/components/account/AccountNav';
import DemoNotice from '@/components/account/DemoNotice';

/**
 * The account area's chrome: heading, section nav, guard — written once so
 * the four pages are only their own content.
 *
 * A LAYOUT RATHER THAN A SHARED COMPONENT each page imports, because the nav
 * must not re-mount when you move between sections: re-mounting resets the
 * horizontal scroll position of the pill row on a phone, so tapping the
 * fourth section would scroll the nav back to the first.
 *
 * Every child page carries `robots: routeRobots(...)` of its own. Metadata
 * does not inherit usefully from a layout for this — a layout's `robots`
 * would be replaced, not merged, by any page that sets its own title.
 */
export default function AccountLayout({ children }) {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Account"
        title="Your account."
        subtitle="Registered products, warranty dates, saved addresses and the claims you have raised."
      />

      <section className="bg-black py-12 sm:py-16">
        <div className="section-container">
          <DemoNotice className="mb-10" />

          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:items-start">
            {/* `lg:sticky` on the rail, not on the content: the sections are
                short enough that the rail is the thing worth keeping on
                screen while a long product list scrolls. */}
            <div className="lg:sticky lg:top-28">
              <AccountNav />
            </div>

            <div className="min-w-0">
              <AccountGuard>{children}</AccountGuard>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
