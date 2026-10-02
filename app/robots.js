import { SITE_URL } from '@/lib/site';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
