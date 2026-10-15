import OrderList from '@/components/account/OrderList';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'My orders — BluNeuron',
    description: 'Purchases registered to your BluNeuron account.',
    path: ROUTES.accountOrders,
  }),
  robots: routeRobots(ROUTES.accountOrders),
};

export default function AccountOrdersPage() {
  return <OrderList />;
}
