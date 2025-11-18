'use client';

import { useEffect, useState } from 'react';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { StockService } from '../services/stockService';
import { Product } from '../types/product';
import Link from 'next/link';

export default function DashboardOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ products: 0, categories: 0, warehouses: 0, lowStock: 0 });
  const [jiraniPicks, setJiraniPicks] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [products, categories, warehouses, lowStock] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories(),
        StockService.getWarehouses(),
        StockService.getLowStock(),
      ]);
      
      // Filter products for Jirani Picks (is_jirani_recommended = 1)
      const jiraniProducts = (products || []).filter(p => p.is_jirani_recommended === 1 && p.active === 1);
      setJiraniPicks(jiraniProducts);
      
      // Filter products for New Arrivals (show_in_new_arrivals = 1)
      const arrivalsProducts = (products || []).filter(p => p.show_in_new_arrivals === 1 && p.active === 1);
      setNewArrivals(arrivalsProducts);
      
      setCounts({
        products: products?.length || 0,
        categories: categories?.length || 0,
        warehouses: warehouses?.length || 0,
        lowStock: lowStock?.length || 0,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cards = [
    { title: 'Products', value: counts.products, href: '/products', color: 'blue' },
    { title: 'Categories', value: counts.categories, href: '/categories', color: 'green' },
    { title: 'Warehouses', value: counts.warehouses, href: '/warehouses', color: 'purple' },
    { title: 'Low Stock Items', value: counts.lowStock, href: '/products', color: 'red' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Overview</h1>
        <p className="text-gray-600">Key metrics for your inventory</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => (
              <a key={c.title} href={c.href} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
                <div className="text-sm text-gray-500">{c.title}</div>
                <div className={`text-3xl font-bold mt-2 ${
                  c.color === 'blue' ? 'text-blue-600' :
                  c.color === 'green' ? 'text-green-600' :
                  c.color === 'purple' ? 'text-purple-600' :
                  'text-red-600'
                }`}>{c.value}</div>
              </a>
            ))}
          </div>

          {/* Jirani Picks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                Jirani Picks
              </h2>
              <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            {jiraniPicks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {jiraniPicks.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category_name || 'Uncategorized'}</p>
                    <p className="text-lg font-bold text-gray-900">{Math.round(product.price || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} frw</p>
                    <Link 
                      href={`/products`}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                    >
                      Edit Product →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No products marked as Jirani Picks yet
              </div>
            )}
          </div>

          {/* New Arrivals Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                New Arrivals
              </h2>
              <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            {newArrivals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {newArrivals.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category_name || 'Uncategorized'}</p>
                    <p className="text-lg font-bold text-gray-900">{Math.round(product.price || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} frw</p>
                    <Link 
                      href={`/products`}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                    >
                      Edit Product →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No products marked as New Arrivals yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}








