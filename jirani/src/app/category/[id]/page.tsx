"use client"
import React, { useState, useEffect } from 'react';
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

  // Filter products by search query
  const filteredProducts = products.filter(product => {
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
      {/* Category Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Categories */}
            <aside className="lg:w-64 flex-shrink-0">
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
                            ? 'bg-indigo-100 text-indigo-700 font-semibold'
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
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-4"
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
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear search
                </button>
              )}
              {!searchQuery && (
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
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
              <h3 className="text-gray-900 text-lg font-bold mb-4">Jirani</h3>
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

