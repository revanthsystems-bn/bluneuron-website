import ProductList from '@/components/account/ProductList';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'My products & warranty — BluNeuron',
    description: 'Units registered to your BluNeuron account, and their warranty status.',
    path: ROUTES.accountProducts,
  }),
  robots: routeRobots(ROUTES.accountProducts),
};

export default function AccountProductsPage() {
  return <ProductList />;
}
