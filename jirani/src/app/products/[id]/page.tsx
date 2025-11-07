"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductService } from '../../services/productService';
import { StockService } from '../../services/stockService';
import { Product, ProductVariant } from '../../types/product';
import { Stock } from '../../types/stock';
import { productRequiresSize, getSizeOptions } from '../../utils/categoryUtils';

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params?.id ? parseInt(params.id as string) : null;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isLiked, setIsLiked] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [stockLevels, setStockLevels] = useState<Stock[]>([]);
  const [availableStock, setAvailableStock] = useState<number>(0);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  // Load stock when variant changes
  useEffect(() => {
    if (productId && selectedVariant) {
      loadStockData();
    }
  }, [productId, selectedVariant?.id]);

  const loadProductData = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const [productData, variantsData] = await Promise.all([
        ProductService.getProductById(productId),
        ProductService.getProductVariants(productId)
      ]);
      
      // Products without variants cannot be displayed
      if (!variantsData || variantsData.length === 0) {
        setProduct(null);
        setVariants([]);
        setLoading(false);
        return;
      }
      
      setProduct(productData);
      setVariants(variantsData || []);
      
      // Auto-select first variant if available
      if (variantsData && variantsData.length > 0) {
        setSelectedVariant(variantsData[0]);
        // Set initial size if variant has size attribute
        if (variantsData[0].attributes?.size) {
          setSelectedSize(String(variantsData[0].attributes.size));
        }
      }
    } catch (error) {
      console.error('Failed to load product data:', error);
      // If product not found or has no variants, set product to null
      if (error instanceof Error && error.message.includes('no variants')) {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStockData = async () => {
    if (!productId || !selectedVariant) return;
    
    try {
      const stockData = await StockService.getStockByProduct(productId, selectedVariant.id);
      setStockLevels(stockData);
      
      // Calculate total available stock (quantity_on_hand - quantity_reserved) across all warehouses
      const totalAvailable = stockData.reduce((sum, stock) => {
        const available = stock.quantity_on_hand - stock.quantity_reserved;
        return sum + (available > 0 ? available : 0);
      }, 0);
      
      setAvailableStock(totalAvailable);
      
      // Reset quantity if it exceeds available stock
      if (quantity > totalAvailable && totalAvailable > 0) {
        setQuantity(totalAvailable);
      } else if (totalAvailable === 0) {
        setQuantity(0);
      }
    } catch (error) {
      console.error('Failed to load stock data:', error);
      setAvailableStock(0);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.attributes?.size) {
      setSelectedSize(String(variant.attributes.size));
    }
    // Reset quantity when variant changes
    setQuantity(1);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    // Find variant with this size
    const variantWithSize = variants.find(v => v.attributes?.size === size);
    if (variantWithSize) {
      setSelectedVariant(variantWithSize);
      // Reset quantity when variant changes
      setQuantity(1);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1);
    } else if (newQuantity > availableStock) {
      setQuantity(availableStock);
    } else {
      setQuantity(newQuantity);
    }
  };

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return (product?.price || 0) + (selectedVariant.additional_price || 0);
    }
    return product?.price || 0;
  };

  const getCurrentImage = () => {
    if (selectedVariant?.image_url) {
      return selectedVariant.image_url;
    }
    return product?.image_url || '';
  };

  const requiresSize = product ? productRequiresSize(product) : false;
  const availableSizes = product ? getSizeOptions(product.category_name || '', product.category || undefined) : [];
  const variantSizes = variants
    .map(v => v.attributes?.size)
    .filter((size): size is string => Boolean(size))
    .filter((size, index, self) => self.indexOf(size) === index);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product || variants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not available</h2>
          <p className="text-gray-600 mb-4">
            This product cannot be displayed because it has no variants. Products must have at least one variant to be displayed.
          </p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/category/${product.category_id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Category</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="relative bg-white h-96 flex items-center justify-center">
              {getCurrentImage() ? (
                <img
                  src={getCurrentImage()}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-6xl">📦</div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {variants.length > 0 && variants.some(v => v.image_url) && (
              <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50">
                {variants.filter(v => v.image_url).map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className={`rounded-lg overflow-hidden transition-all transform ${
                      selectedVariant?.id === variant.id 
                        ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-lg' 
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                  >
                    <img
                      src={variant.image_url!}
                      alt={variant.sku}
                      className="w-full h-20 object-contain bg-white rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {product.description && (
              <p className="text-gray-600 mb-6">{product.description}</p>
            )}

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-red-500">
                {getCurrentPrice().toLocaleString()} RWF
              </span>
              {selectedVariant && selectedVariant.additional_price > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  (Base: {product.price.toLocaleString()} RWF + {selectedVariant.additional_price.toLocaleString()} RWF)
                </span>
              )}
            </div>

            {/* Size Selection */}
            {requiresSize && availableSizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Size
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableSizes.map((size) => {
                    const variantForSize = variants.find(v => v.attributes?.size === size);
                    const isAvailable = variantForSize !== undefined;
                    const isSelected = selectedSize === size;
                    
                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && handleSizeSelect(size)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform ${
                          isSelected
                            ? 'bg-indigo-500 text-white shadow-md scale-105 ring-2 ring-indigo-300'
                            : isAvailable
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variant Selection (if not size-based) */}
            {!requiresSize && variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Variant
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`w-full p-4 rounded-lg text-left transition-all transform ${
                        selectedVariant?.id === variant.id
                          ? 'bg-indigo-50 shadow-md ring-2 ring-indigo-500 scale-[1.02]'
                          : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {Object.entries(variant.attributes || {}).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: <strong>{String(value)}</strong>
                              </span>
                            ))}
                          </div>
                          {variant.additional_price > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              +{variant.additional_price.toLocaleString()} RWF
                            </div>
                          )}
                        </div>
                        {variant.image_url && (
                          <img
                            src={variant.image_url}
                            alt={variant.sku}
                            className="w-16 h-16 object-contain ml-4 rounded-lg bg-white p-1"
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Variant Info */}
            {selectedVariant && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Selected Variant</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>SKU: {selectedVariant.sku}</div>
                  {Object.entries(selectedVariant.attributes || {}).map(([key, value]) => (
                    <div key={key}>
                      {key}: <strong>{String(value)}</strong>
                    </div>
                  ))}
                  <div className="mt-2">
                    <span className="font-medium">Available Stock:</span>{' '}
                    <span className={availableStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {availableStock} {availableStock === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {selectedVariant && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || availableStock === 0}
                    className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    disabled={availableStock === 0}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= availableStock || availableStock === 0}
                    className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus size={18} />
                  </button>
                  {availableStock > 0 && (
                    <span className="text-sm text-gray-600 ml-2">
                      (Max: {availableStock})
                    </span>
                  )}
                </div>
                {availableStock === 0 && (
                  <p className="text-sm text-red-600 mt-2">Out of stock</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (availableStock > 0 && quantity > 0) {
                    setCartCount(cartCount + quantity);
                    // TODO: Add actual cart logic here
                    alert(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`);
                  }
                }}
                disabled={availableStock === 0 || quantity === 0}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                Add {quantity > 0 ? `${quantity} ` : ''}to Cart
              </button>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Product Details */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>SKU:</strong> {product.sku}</div>
                {product.brand && <div><strong>Brand:</strong> {product.brand}</div>}
                {product.category_name && <div><strong>Category:</strong> {product.category_name}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

