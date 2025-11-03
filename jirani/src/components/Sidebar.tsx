'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <div className="font-semibold">Inventory</div>
        <button
          aria-label="Toggle sidebar"
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          onClick={() => setOpen(!open)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 p-4 pt-6 md:pt-4 md:block ${open ? 'block' : 'hidden'} md:sticky md:top-0 md:h-screen md:self-start z-20 mt-12 md:mt-0`}>
        <div className="mb-6 hidden md:block">
          <div className="text-xl font-bold">Inventory</div>
          <div className="text-xs text-gray-500">Management Dashboard</div>
        </div>
        <nav className="space-y-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${isActive('/dashboard') ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </Link>
          <Link 
            href="/products" 
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${isActive('/products') ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </Link>
          <Link 
            href="/categories" 
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${isActive('/categories') ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categories
          </Link>
          <Link 
            href="/warehouses" 
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${isActive('/warehouses') ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Warehouses
          </Link>
        </nav>
        <div className="mt-8 text-xs text-gray-400 hidden md:block">© {new Date().getFullYear()} IMS</div>
      </aside>
    </>
  );
}



