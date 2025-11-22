"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductService } from '../../services/productService';
import { CategoryService } from '../../services/categoryService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import ProductCard from '../../../components/ProductCard';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.id ? parseInt(params.id as string) : null;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showMobileCategoryNav, setShowMobileCategoryNav] = useState(true);
  const [showMobileCategoryDropdown, setShowMobileCategoryDropdown] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (categoryId) {
      loadCategoryData();
    }
  }, [categoryId]);

  const loadCategoryData = async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories()
      ]);
      
      // Store all categories
      setCategories(categoriesData || []);
      
      // Find the category
      const foundCategory = categoriesData?.find(c => c.id === categoryId);
      setCategory(foundCategory || null);
      
      // Filter products by category and active status
      const filteredProducts = (productsData || []).filter(
        p => p.category_id === categoryId && p.active === 1
      );
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Failed to load category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    setCartCount(cartCount + 1);
  };

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const last = lastScrollYRef.current;

      if (current > last && current > 100) {
        setShowMobileCategoryNav(false);
        setShowMobileCategoryDropdown(false);
      } else if (current < last - 4) {
        setShowMobileCategoryNav(true);
      }

      lastScrollYRef.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Category Navigation - Top of page */}
      <div
        className={`lg:hidden sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${
          showMobileCategoryNav
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
            <span className="text-xs text-gray-500 font-medium">
              {categories.length} total
            </span>
          </div>
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 pr-10 scrollbar-hide">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      cat.id === categoryId
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setShowMobileCategoryDropdown(false)}
                  >
                    {cat.name}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">No categories available</p>
              )}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-white/0 flex items-center justify-end pr-2">
              <ArrowRight size={18} className="text-gray-400" />
            </div>
          </div>

          {categories.length > 6 && (
            <button
              className="mt-3 text-xs font-semibold text-gray-600 flex items-center gap-1 hover:text-orange-500 transition"
              onClick={() => setShowMobileCategoryDropdown((prev) => !prev)}
            >
              {showMobileCategoryDropdown ? 'Hide' : 'More'} categories
              <span className="text-lg leading-none">{showMobileCategoryDropdown ? '−' : '>'}</span>
            </button>
          )}

          {showMobileCategoryDropdown && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {categories.map((cat) => (
                  <Link
                    key={`dropdown-${cat.id}`}
                    href={`/category/${cat.id}`}
                    className={`px-3 py-2 rounded-lg transition ${
                      cat.id === categoryId
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileCategoryDropdown(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Categories (Desktop only) */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">All Categories</h2>
                <nav className="space-y-2">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.id}`}
                        className={`block px-4 py-3 rounded-lg transition-all ${
                          cat.id === categoryId
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {cat.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No categories available</p>
                  )}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb and Category Header */}
              <div className="mb-8">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            
            {category ? (
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-gray-600 text-base">{category.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Category
                </h1>
                <p className="text-sm text-gray-500">Category not found</p>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => {
                // Calculate discount and rating for demo
                const hasDiscount = Math.random() > 0.7;
                const discountPercent = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
                const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 to 5.0
                const orders = Math.floor(Math.random() * 200) + 10;
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    discountPercent={hasDiscount ? discountPercent : 0}
                    rating={rating}
                    orders={orders}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No products found' : 'No products in this category'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `Try adjusting your search for "${searchQuery}"`
                  : 'Check back later for new products'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear search
                </button>
              )}
              {!searchQuery && (
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                >
                  <ArrowRight size={18} />
                  Browse all categories
                </Link>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#ececec' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img 
                src="/logo/jilani-white-logo.png" 
                alt="Jirani Logo" 
                className="w-auto h-auto max-h-10 mb-4 object-contain"
              />
              <p className="text-xs text-gray-700">Your trusted local marketplace for quality products across Rwanda.</p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4 text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="text-gray-700 hover:text-gray-900 transition">Home</Link></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">About Us</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4 text-base">Customer Service</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">Delivery Info</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">Returns</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">Track Order</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4 text-base">Follow Us</h4>
              <p className="text-xs mb-4 text-gray-700">Stay connected on social media</p>
              <div className="flex space-x-4">
                <button className="text-2xl hover:opacity-70 transition">📘</button>
                <button className="text-2xl hover:opacity-70 transition">📷</button>
                <button className="text-2xl hover:opacity-70 transition">🐦</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-400 mt-8 pt-8 text-center text-xs text-gray-700">
            <p>© 2025 Jirani. All rights reserved. Serving customers across Rwanda.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

