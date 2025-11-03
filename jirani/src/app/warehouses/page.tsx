'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StockService } from '../services/stockService';
import { Warehouse } from '../types/stock';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState<{ name: string; address: string; phone: string; is_default: boolean }>({
    name: '',
    address: '',
    phone: '',
    is_default: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StockService.getWarehouses();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', phone: '', is_default: false });
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ name: w.name, address: w.address, phone: w.phone || '', is_default: !!w.is_default });
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (editing) {
        const updated = await StockService.updateWarehouse(editing.id, form as any);
        setWarehouses(warehouses.map(w => (w.id === editing.id ? updated : w)));
      } else {
        const created = await StockService.createWarehouse(form as any);
        setWarehouses([...warehouses, created]);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', address: '', phone: '', is_default: false });
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      setLoading(true);
      await StockService.deleteWarehouse(id);
      setWarehouses(warehouses.filter(w => w.id !== id));
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Warehouses</h1>
          <p className="text-black mt-2">Manage storage locations</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-black">Warehouses</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search warehouses..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <span className="absolute right-2 top-2.5 text-gray-400 text-sm">⌕</span>
                </div>
                <button
                  onClick={openCreate}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 whitespace-nowrap"
                >
                  Add Warehouse
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {warehouses.filter(w => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    w.name.toLowerCase().includes(q) ||
                    (w.address || '').toLowerCase().includes(q) ||
                    (w.phone || '').toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? `No warehouses found matching "${searchQuery}"` : 'No warehouses yet. Create your first warehouse!'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {warehouses
                      .filter(w => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          w.name.toLowerCase().includes(q) ||
                          (w.address || '').toLowerCase().includes(q) ||
                          (w.phone || '').toLowerCase().includes(q)
                        );
                      })
                      .map(w => (
                      <div key={w.id} className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-black text-lg">{w.name}</h3>
                              {w.is_default && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500">📍</span>
                                <span>{w.address}</span>
                              </div>
                              {w.phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">📞</span>
                                  <span>{w.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Link
                            href={`/warehouses/${w.id}`}
                            className="flex-1 text-center text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded text-sm font-medium transition"
                          >
                            View Products
                          </Link>
                          <button
                            onClick={() => openEdit(w)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded text-sm font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(w.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-black">{editing ? 'Edit Warehouse' : 'Create Warehouse'}</h3>
            </div>
            <form onSubmit={submit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-black"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="isDefault"
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-200"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium text-black">Set as default warehouse</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


