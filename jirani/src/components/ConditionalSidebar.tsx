'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

// Admin routes that should show the sidebar
// Note: /products/[id] should NOT show sidebar (only /products listing page)
const ADMIN_ROUTES = ['/dashboard', '/categories', '/warehouses'];

export default function ConditionalSidebar() {
  const pathname = usePathname();
  
  // Check if it's the exact /products route (not /products/[id])
  const isProductsListing = pathname === '/products';
  
  // Check if it matches other admin routes
  const isOtherAdminRoute = ADMIN_ROUTES.some(route => pathname?.startsWith(route));
  
  const isAdminRoute = isProductsListing || isOtherAdminRoute;

  if (!isAdminRoute) {
    return null;
  }

  return <Sidebar />;
}



