import { SITE_URL } from '@/lib/site';
import { SHOW_PRIVACY } from '@/lib/iriz';

const ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/specs', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/compare', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  // Dropped from the sitemap while SHOW_PRIVACY is false — the page still
  // renders, but an unlinked draft policy should not be advertised for
  // crawling. app/legal/privacy/page.jsx sets noindex over the same flag.
  ...(SHOW_PRIVACY ? [{ path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' }] : []),
  { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/shipping', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/returns', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
