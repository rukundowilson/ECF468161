'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Heart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const lastScrollY = useRef(0);

  // Determine navbar configuration based on route
  // Only hide navbar on these specific admin routes (they have sidebar)
  const isAdminRoute = pathname?.startsWith('/dashboard') || 
                       pathname?.startsWith('/categories') || 
                       pathname?.startsWith('/warehouses');
  
  const isProductDetailPage = pathname?.match(/^\/products\/\d+$/);
  const isProductsListingPage = pathname === '/products';
  const isHomePage = pathname === '/';
  
  // Hide on scroll behavior - enable on all pages
  const shouldHideOnScroll = true;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!shouldHideOnScroll || isAdminRoute) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsScrollingDown(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldHideOnScroll, isAdminRoute]);

  // Hide navbar on admin routes (they have sidebar)
  // Note: /products listing page shows BOTH navbar and sidebar
  // This check must come AFTER all hooks
  if (isAdminRoute) {
    return null;
  }

  // Show search on all pages (consistent across all pages)
  const showSearch = true;
  
  // Show wishlist on all pages (consistent)
  const showWishlist = true;

  return (
    <header 
      className={`bg-white sticky top-0 z-50 border-b border-gray-200 ${
        shouldHideOnScroll ? `transition-transform duration-300 ${isScrollingDown ? '-translate-y-full' : 'translate-y-0'}` : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img 
              src="/logo/jilani-white-logo.png" 
              alt="Jirani Logo" 
              className="w-auto h-auto max-h-12 object-contain group-hover:opacity-80 transition-opacity"
              onError={(e) => {
                console.error('Logo failed to load from /logo/jilani-white-logo.png');
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>

          {/* Search Bar - Desktop */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              </div>
            </div>
          )}

          {/* Right Icons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <Link 
              href="/launch-outfit"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">Launch Outfit</span>
            </Link>
            
            {showWishlist && (
              <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium">
                <Heart size={22} />
                <span className="text-sm">Wishlist</span>
              </button>
            )}
            
            <button className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium">
              <ShoppingCart size={22} />
              <span className="hidden md:inline text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>
            
            {showSearch && (
              <button 
                className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 transition" 
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} className="text-gray-900" /> : <Menu size={24} className="text-gray-900" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <div className="flex flex-col space-y-2">
              <Link
                href="/launch-outfit"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Launch Outfit</span>
              </Link>
              
              {showWishlist && (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium text-left"
                >
                  <Heart size={20} />
                  <span>Wishlist</span>
                </button>
              )}
              
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium text-left"
              >
                <ShoppingCart size={20} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

