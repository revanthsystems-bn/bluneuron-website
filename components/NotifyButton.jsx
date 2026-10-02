'use client';

import Magnetic from './Magnetic';
import { useNotify } from './notify/NotifyProvider';
import { NOTIFY_SOURCES } from '@/lib/web3forms';

/**
 * Every purchase-intent surface on the site while it is pre-launch — the
 * masthead, the mobile menu, the mobile sticky bar. All of them open the one
 * signup modal (components/NewsletterPopup, owned by NotifyProvider), so the
 * CTA behaves identically wherever it is clicked.
 *
 * A button, not a link: it opens a dialog rather than navigating. `source` is
 * passed through to Web3Forms so the inbox shows which surface a signup came
 * from.
 */
export default function NotifyButton({
  // No vague default: every call site names its surface, so the inbox never
  // shows a signup it cannot attribute. See NOTIFY_SOURCES in lib/web3forms.
  source = NOTIFY_SOURCES.masthead,
  label = 'Notify Me',
  className = 'btn-primary',
  strength = 0.15,
  onClick,
}) {
  const { openNotify } = useNotify();

  return (
    <Magnetic
      as="button"
      type="button"
      className={className}
      strength={strength}
      onClick={() => {
        onClick?.();
        openNotify(source);
      }}
    >
      {label}
    </Magnetic>
  );
}
