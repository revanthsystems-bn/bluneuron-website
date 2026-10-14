import ProfilePanel from '@/components/account/ProfilePanel';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Your profile — BluNeuron',
    description: 'Your BluNeuron account profile.',
    path: ROUTES.account,
  }),
  robots: routeRobots(ROUTES.account),
};

export default function AccountProfilePage() {
  return <ProfilePanel />;
}
