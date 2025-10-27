'use client';

import { useState, useEffect } from 'react';
import { ProductService } from '../services/productService';
import { Product, ProductVariant, CreateProductRequest, CreateProductVariantRequest } from '../types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<CreateProductRequest>({
    sku: '',
    name: '',
    description: '',
    category_id: 0,
    brand: '',
    price: 0,
    active: 1,
  });

  const [variantForm, setVariantForm] = useState<CreateProductVariantRequest>({
    sku: '',
    attributes: {},
    additional_price: 0,
    active: 1,
  });

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load variants when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      loadVariants(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductService.getProducts();
      console.log('Products data:', data);
      // Ensure we have a valid array and filter out any invalid products
      const validProducts = Array.isArray(data) ? data.filter(product => product && product.id) : [];
      setProducts(validProducts);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductService.getProductVariants(productId);
      // Ensure we have a valid array and filter out any invalid variants
      const validVariants = Array.isArray(data) ? data.filter(variant => variant && variant.id) : [];
      setVariants(validVariants);
    } catch (err: any) {
      setError(err.message || 'Failed to load variants');
      setVariants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const newProduct = await ProductService.createProduct(productForm);
      setProducts([...products, newProduct]);
      setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1 });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProduct = await ProductService.updateProduct(editingProduct.id, productForm);
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      setError(null);
      await ProductService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setVariants([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);
      const newVariant = await ProductService.createProductVariant(selectedProduct.id, variantForm);
      setVariants([...variants, newVariant]);
      setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
      setShowVariantForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create variant');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      setLoading(true);
      setError(null);
      const updatedVariant = await ProductService.updateProductVariant(editingVariant.id, variantForm);
      setVariants(variants.map(v => v.id === editingVariant.id ? updatedVariant : v));
      setEditingVariant(null);
      setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to update variant');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      setLoading(true);
      setError(null);
      await ProductService.deleteProductVariant(id);
      setVariants(variants.filter(v => v.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
    } finally {
      setLoading(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      brand: product.brand || '',
      price: product.price,
      active: product.active,
    });
  };

  const startEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      sku: variant.sku,
      attributes: variant.attributes || {},
      additional_price: variant.additional_price,
      active: variant.active,
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditingVariant(null);
    setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1 });
    setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Products Management</h1>
          <p className="text-black mt-2">Manage your products and their variants</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-black">Products</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {products.filter(product => product && product.id).map((product, index) => (
                    <div
                      key={product.id || index}
                      className={`p-4 border rounded cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-black">{product.name || 'Unnamed Product'}</h3>
                          <p className="text-sm text-black mt-1">{product.description || 'No description'}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            SKU: {product.sku || 'N/A'} | Price: ${product.price || 0}
                          </p>
                          <p className="text-xs text-gray-600">
                            Category: {product.category_name || 'N/A'} | Brand: {product.brand || 'N/A'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.id) startEditProduct(product);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.id) handleDeleteProduct(product.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-black">
                  Variants {selectedProduct && `- ${selectedProduct.name}`}
                </h2>
                {selectedProduct && (
                  <button
                    onClick={() => setShowVariantForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Add Variant
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {!selectedProduct ? (
                <div className="text-center py-8 text-gray-600">
                  Select a product to view its variants
                </div>
              ) : loading ? (
                <div className="text-center py-4 text-black">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {variants.filter(variant => variant && variant.id).map((variant) => (
                    <div key={variant.id} className="p-4 border border-gray-200 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-black">SKU: {variant.sku}</h3>
                          <p className="text-sm text-black">
                            Additional Price: ${variant.additional_price}
                          </p>
                          <p className="text-sm text-black">
                            Attributes: {variant.attributes ? JSON.stringify(variant.attributes) : 'None'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Status: {variant.active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditVariant(variant)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Product Modal */}
        {(showCreateForm || editingProduct) && (
          <div className="fixed inset-0 text-black bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </h3>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">SKU</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black">Category ID</label>
                      <input
                        type="number"
                        value={productForm.category_id || ''}
                        onChange={(e) => setProductForm({ ...productForm, category_id: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Brand</label>
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price || ''}
                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Active</label>
                      <select
                        value={productForm.active}
                        onChange={(e) => setProductForm({ ...productForm, active: parseInt(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      cancelEdit();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create/Edit Variant Modal */}
        {(showVariantForm || editingVariant) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingVariant ? 'Edit Variant' : 'Create Variant'}
              </h3>
              <form onSubmit={editingVariant ? handleUpdateVariant : handleCreateVariant}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">SKU</label>
                    <input
                      type="text"
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Additional Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variantForm.additional_price || ''}
                        onChange={(e) => setVariantForm({ ...variantForm, additional_price: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Attributes (JSON)</label>
                    <textarea
                      value={JSON.stringify(variantForm.attributes, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setVariantForm({ ...variantForm, attributes: parsed });
                        } catch (err) {
                          // Invalid JSON, keep the text as is for now
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={4}
                      placeholder='{"color": "red", "size": "large"}'
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Active</label>
                    <select
                      value={variantForm.active}
                      onChange={(e) => setVariantForm({ ...variantForm, active: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantForm(false);
                      cancelEdit();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingVariant ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
