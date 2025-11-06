"use client"
import React, { useState, useEffect } from 'react';
import { ArrowRight, Truck, Globe, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductService } from './services/productService';
import { Product } from './types/product';
import { CategoryService } from './services/categoryService';
import { Category } from './types/category';
import ProductCard from '../components/ProductCard';

export default function EcommerceHomepage() {
  const [cartCount, setCartCount] = useState(0);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [jiraniPicks, setJiraniPicks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [categoryImages, setCategoryImages] = useState<Record<number, string>>({});
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [products, categoriesData] = await Promise.all([
          ProductService.getProducts(),
          CategoryService.getCategories()
        ]);
        
        setCategories(categoriesData || []);
        
        // Filter products for New Arrivals (show_in_new_arrivals = 1 and active = 1)
        const arrivals = (products || []).filter(p => p.show_in_new_arrivals === 1 && p.active === 1);
        setNewArrivals(arrivals);
        
        // Filter products for Jirani Picks (is_jirani_recommended = 1 and active = 1)
        const picks = (products || []).filter(p => p.is_jirani_recommended === 1 && p.active === 1);
        setJiraniPicks(picks);
        
        // Load first product image for each category from already loaded products
        const imagesMap: Record<number, string> = {};
        if (categoriesData && categoriesData.length > 0 && products && products.length > 0) {
          for (const category of categoriesData) {
            // Find first active product with an image in this category
            const productWithImage = products.find(
              p => p.category_id === category.id && 
                   p.active === 1 && 
                   p.image_url && 
                   p.image_url.trim() !== ''
            );
            
            if (productWithImage?.image_url) {
              imagesMap[category.id] = productWithImage.image_url;
            }
          }
        }
        
        setCategoryImages(imagesMap);
        
        // Debug: Log products with images
        console.log('Products loaded:', {
          total: products?.length || 0,
          newArrivals: arrivals.length,
          jiraniPicks: picks.length,
          withImages: (products || []).filter(p => p.image_url).length,
          sampleProduct: products?.[0],
          categoryImages: Object.keys(imagesMap).length
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCategorySelect = (categoryId: number | '') => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      window.location.href = `/category/${categoryId}`;
    }
  };

  // Helper function to get dynamic icon and color for category
  const getCategoryDisplay = (categoryId: number, categoryName: string) => {
    // Dynamic icon selection based on category ID (modulo to cycle through icons)
    const icons = ['📦', '🛍️', '✨', '🎯', '🏆', '💎', '⭐', '🔥'];
    const iconIndex = categoryId % icons.length;
    
    // Dynamic color selection based on category ID
    const colors = ['bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-orange-200', 'bg-indigo-100', 'bg-red-100'];
    const colorIndex = categoryId % colors.length;
    
    return { 
      icon: icons[iconIndex], 
      color: colors[colorIndex] 
    };
  };

  const addToCart = () => {
    setCartCount(cartCount + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-0 pb-0 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left Sidebar - Delivery Summary */}
            <div className="md:col-span-1 bg-white p-6">
              {/* Delivery Location Selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Set Delivery District</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 pl-10 pr-4 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer">
                    <option value="">Select District</option>
                    <option value="kigali">Kigali City</option>
                    <option value="gasabo">Gasabo</option>
                    <option value="nyarugenge">Nyarugenge</option>
                    <option value="kicukiro">Kicukiro</option>
                    <option value="musanze">Musanze</option>
                    <option value="rubavu">Rubavu</option>
                    <option value="burera">Burera</option>
                    <option value="gakenke">Gakenke</option>
                    <option value="ruhango">Ruhango</option>
                    <option value="nyamagabe">Nyamagabe</option>
                    <option value="nyanza">Nyanza</option>
                    <option value="gisagara">Gisagara</option>
                    <option value="huye">Huye</option>
                    <option value="nyaruguru">Nyaruguru</option>
                    <option value="muhanga">Muhanga</option>
                    <option value="kamonyi">Kamonyi</option>
                    <option value="karongi">Karongi</option>
                    <option value="rutsiro">Rutsiro</option>
                    <option value="rubavu">Rubavu</option>
                    <option value="nyabihu">Nyabihu</option>
                    <option value="rusizi">Rusizi</option>
                    <option value="nyamasheke">Nyamasheke</option>
                    <option value="nyagatare">Nyagatare</option>
                    <option value="gatsibo">Gatsibo</option>
                    <option value="kayonza">Kayonza</option>
                    <option value="kirehe">Kirehe</option>
                    <option value="ngoma">Ngoma</option>
                    <option value="bugesera">Bugesera</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-lg">🇷🇼</span>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-4">Delivery Summary</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-gray-900 mb-1">Kigali Delivery</h4>
                  <p className="text-xs text-gray-600">Fast delivery in 1-2 working days</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 mb-1">Other Districts</h4>
                  <p className="text-xs text-gray-600">Nationwide delivery in 2-4 working days</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 mb-1">Self Pick-Up</h4>
                  <p className="text-xs text-gray-600">Available anytime at our store</p>
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="md:col-span-3 relative rounded-2xl overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="/kgl_fashion.png"
                  alt="Fashion Collection - Kigali"
                  fill
                  className="object-cover"
                  priority
                  quality={90}
                />
              </div>
              {/* Dark Overlay for text visibility */}
              <div className="absolute inset-0 bg-black/50"></div>
              
              <div className="relative z-10 py-20 md:py-32 px-4 sm:px-6">
                <div className="text-center md:text-left relative max-w-2xl">
                  <div className="absolute -top-8 -right-8 md:-right-16 text-8xl md:text-9xl animate-pulse opacity-40 drop-shadow-2xl hidden lg:block pointer-events-none">🛍️</div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white drop-shadow-2xl">
                    Shop in Kigali & Across Rwanda
                  </h2>
                  <p className="text-lg md:text-xl mb-10 text-white/90 leading-relaxed drop-shadow-lg">
                    Discover amazing products from local vendors across <span className="font-bold text-orange-300">Kigali and all districts</span>. Fast delivery nationwide, up to 50% off on selected items!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Link 
                      href="/products"
                      className="group bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-base hover:bg-orange-600 transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2 shadow-xl"
                    >
                      Shop Now
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Login/Register and Features */}
            <div className="md:col-span-1 bg-white p-6">
              {/* Login/Register Buttons */}
              <div className="flex gap-2 mb-6">
                <button className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-orange-600 transition-all">
                  Login
                </button>
                <button className="flex-1 bg-white text-gray-700 border-2 border-gray-300 px-4 py-3 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all">
                  Register
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Truck className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Great Value</h3>
                    <p className="text-xs text-gray-600">Continuous promotions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Globe className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Rwanda Delivery</h3>
                    <p className="text-xs text-gray-600">Nationwide delivery across all districts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <CreditCard className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Safe Payment</h3>
                    <p className="text-xs text-gray-600">Popular and secure payment methods.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <ShieldCheck className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Shop with Confidence</h3>
                    <p className="text-xs text-gray-600">Protect your purchase and delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Categories */}
      <section className="pt-0 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 pt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Shop by Category</h2>
            <p className="text-base text-gray-600">Browse our wide selection of products</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {loading ? (
              <div className="col-span-full text-center text-gray-500 py-8">Loading categories...</div>
            ) : categories.length > 0 ? (
              categories.map((category) => {
                const display = getCategoryDisplay(category.id, category.name);
                const categoryImage = categoryImages[category.id];
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    className={`${display.color} p-6 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 hover:-translate-y-1 text-center group cursor-pointer overflow-hidden`}
                  >
                    <div className="mb-3 group-hover:scale-110 transition-transform flex items-center justify-center h-20">
                      {categoryImage && !failedImages.has(category.id) ? (
                        <img 
                          src={categoryImage} 
                          alt={category.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={() => {
                            // Mark this image as failed and show icon fallback
                            setFailedImages(prev => new Set(prev).add(category.id));
                          }}
                        />
                      ) : (
                        <div className="text-5xl">{display.icon}</div>
                      )}
                    </div>
                    <p className="font-bold text-gray-800 text-xs md:text-sm">{category.name}</p>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No categories available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">New Arrivals</h2>
              <p className="text-sm text-gray-600">Handpicked products just for you</p>
            </div>
            <Link 
              href="/products"
              className="mt-4 sm:mt-0 flex items-center gap-2 text-gray-700 font-bold text-base hover:text-gray-800 transition group"
            >
              View All Products
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newArrivals.map((product) => {
                const hasDiscount = Math.random() > 0.7;
                const discountPercent = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
                const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
                const orders = Math.floor(Math.random() * 200) + 10;
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    discountPercent={discountPercent}
                    rating={rating}
                    orders={orders}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No new arrivals at the moment. Check back soon!</div>
          )}
        </div>
      </section>

      {/* Trending Deals */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">💎jirani picks</h2>
            </div>
            <Link 
              href="/products"
              className="mt-4 sm:mt-0 flex items-center gap-2 text-gray-700 font-bold text-base hover:text-gray-800 transition group"
            >
              View All Products
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : jiraniPicks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {jiraniPicks.map((product) => {
                const hasDiscount = Math.random() > 0.7;
                const discountPercent = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
                const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
                const orders = Math.floor(Math.random() * 200) + 10;
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    discountPercent={discountPercent}
                    rating={rating}
                    orders={orders}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No Jirani picks available at the moment. Check back soon!</div>
          )}
        </div>
      </section>

      {/* Newsletter & Shopping Guide */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Newsletter */}
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-extrabold mb-3 text-gray-900 tracking-tight">Subscribe to Our Newsletter</h2>
              <p className="text-sm text-gray-800 mb-6 font-medium">
                Get the latest deals, exclusive offers, and new product announcements directly in your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm font-medium bg-white border border-gray-200"
                />
                <button className="bg-orange-500 text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-orange-600 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 whitespace-nowrap">
                  Subscribe
                  <ArrowRight size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-3">We respect your privacy. Unsubscribe at any time.</p>
            </div>

            {/* Shopping Guide */}
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-extrabold mb-3 text-gray-900 tracking-tight">Shopping Guide</h2>
              <ul className="space-y-2 text-sm text-gray-800 font-medium">
                <li className="flex items-center gap-2">
                  <ArrowRight size={16} className="text-gray-600" />
                  How To Register
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={16} className="text-gray-600" />
                  How To Place An Order
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={16} className="text-gray-600" />
                  How To Pay
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#ececec' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-gray-900 text-lg font-bold mb-4">Jirani</h3>
              <p className="text-xs text-gray-700">Your trusted local marketplace for quality products across Rwanda.</p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4 text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">About Us</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">Contact</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition">FAQs</a></li>
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