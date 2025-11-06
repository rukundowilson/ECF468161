'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StockService } from '../../services/stockService';
import { Warehouse, Stock } from '../../types/stock';

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const warehouseId = Number(idParam);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [items, setItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!warehouseId) return;
    try {
      setLoading(true);
      setError(null);
      const [w, stock] = await Promise.all([
        StockService.getWarehouseById(warehouseId),
        StockService.getStockByWarehouse(warehouseId),
      ]);
      setWarehouse(w);
      setItems(Array.isArray(stock) ? stock : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load warehouse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [warehouseId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {warehouse ? `Products in ${warehouse.name}` : 'Warehouse'}
            </h1>
            <p className="text-gray-600">Stock by product/variant</p>
          </div>
          <button className="text-sm text-gray-700 hover:text-black" onClick={() => router.push('/warehouses')}>
            ← Back to Warehouses
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}

        {loading ? (
          <div className="py-12 text-center">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-600">No stock found in this warehouse.</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Variant SKU</th>
                  <th className="py-2 pr-4">On Hand</th>
                  <th className="py-2 pr-4">Reserved</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-4">{(s as any).product_name || '-'}</td>
                    <td className="py-2 pr-4">{(s as any).product_sku || '-'}</td>
                    <td className="py-2 pr-4">{(s as any).variant_sku || '-'}</td>
                    <td className="py-2 pr-4">{s.quantity_on_hand}</td>
                    <td className="py-2 pr-4">{s.quantity_reserved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}















