import AddressList from '@/components/account/AddressList';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Saved addresses — BluNeuron',
    description: 'Addresses saved to your BluNeuron account.',
    path: ROUTES.accountAddresses,
  }),
  robots: routeRobots(ROUTES.accountAddresses),
};

/** A server shell; the list and its forms are the client leaf. */
export default function AccountAddressesPage() {
  return <AddressList />;
}
