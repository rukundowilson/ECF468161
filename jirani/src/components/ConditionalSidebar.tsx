'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

// Admin routes that should show the sidebar
const ADMIN_ROUTES = ['/dashboard', '/products', '/categories', '/warehouses'];

export default function ConditionalSidebar() {
  const pathname = usePathname();
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname?.startsWith(route));

  if (!isAdminRoute) {
    return null;
  }

  return <Sidebar />;
}



