'use client';

import { useState, useEffect } from 'react';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { StockService } from '../services/stockService';
import { Product, ProductVariant, CreateProductRequest, CreateProductVariantRequest } from '../types/product';
import { Category } from '../types/category';
import { Stock, Warehouse, StockAdjustmentRequest } from '../types/stock';
import { productRequiresSize, getSizeType, getSizeOptions, validateSizeFormat, usesNumericSizes, usesLetterSizes } from '../utils/categoryUtils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [productInitialWarehouseId, setProductInitialWarehouseId] = useState<number | ''>('');
  const [productInitialQty, setProductInitialQty] = useState<number>(0);
  const [useMultipleSizes, setUseMultipleSizes] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState<CreateProductRequest>({
    sku: '',
    name: '',
    description: '',
    category_id: 0,
    brand: '',
    price: 0,
    active: 1,
    size: '',
    is_jirani_recommended: 0,
    show_in_new_arrivals: 0,
  });

  const [variantForm, setVariantForm] = useState<CreateProductVariantRequest>({
    sku: '',
    attributes: {},
    additional_price: 0,
    active: 1,
  });
  const [attributePairs, setAttributePairs] = useState<Array<{key: string, value: string}>>([{key: '', value: ''}]);
  const [productAttributePairs, setProductAttributePairs] = useState<Array<{key: string, value: string}>>([{key: '', value: ''}]);
  const [autoGenerateVariantSku, setAutoGenerateVariantSku] = useState(true);
  const [generatedVariantSku, setGeneratedVariantSku] = useState('');
  const [variantImageFile, setVariantImageFile] = useState<File | null>(null);
  const [variantImagePreview, setVariantImagePreview] = useState<string | null>(null);
  const [variantInitialWarehouseId, setVariantInitialWarehouseId] = useState<number | ''>('');
  const [variantInitialQty, setVariantInitialQty] = useState<number>(0);
  
  // Helper function to get category size information
  const getCategorySizeInfo = (product: Product) => {
    if (!product || !product.category) return null;
    
    const { requires_size, size_type, size_options } = product.category;
    
    if (requires_size !== 1) return null;
    
    let sizeOptions: string[] = [];
    
    if (size_options) {
      if (Array.isArray(size_options)) {
        // Already an array
        sizeOptions = size_options;
      } else if (typeof size_options === 'string') {
        try {
          // Try to parse as JSON first
          sizeOptions = JSON.parse(size_options);
        } catch (error) {
          // If JSON parsing fails, try to split by comma (fallback for old format)
          try {
            sizeOptions = size_options.split(',').map(option => option.trim()).filter(option => option.length > 0);
          } catch (splitError) {
            console.error('Error parsing size options:', splitError);
            sizeOptions = [];
          }
        }
      }
    }
    
    return {
      requiresSize: true,
      sizeType: size_type,
      sizeOptions: sizeOptions.length > 0 ? sizeOptions : getSizeOptions(product.category_name, product.category)
    };
  };
  
  // Stock management state
  const [stockLevels, setStockLevels] = useState<Stock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustmentRequest>({
    product_id: 0,
    variant_id: null,
    warehouse_id: 0,
    new_quantity: 0,
    reason: '',
    created_by: 'admin'
  });

  // Load products and categories on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadWarehouses();
  }, []);

  // Load variants when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      loadVariants(selectedProduct.id);
    } else {
      setVariants([]);
    }
  }, [selectedProduct]);

  // Generate initial variant SKU when form opens
  useEffect(() => {
    if (showVariantForm && selectedProduct && autoGenerateVariantSku) {
      generateVariantSku(selectedProduct.sku, {});
    }
  }, [showVariantForm, selectedProduct, autoGenerateVariantSku]);

  // Initialize variant form when modal opens
  useEffect(() => {
    if (showVariantForm && selectedProduct) {
      setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
      
      // Check if the selected product category requires size
      const requiresSize = productRequiresSize(selectedProduct);
      
      if (requiresSize) {
        // Pre-fill size field with proper configuration
        setAttributePairs([{key: 'size', value: ''}]);
      } else {
        // Start with empty attribute pair for non-size categories
        setAttributePairs([{key: '', value: ''}]);
      }
      
      setAutoGenerateVariantSku(true);
      setGeneratedVariantSku('');
      
      // Generate initial SKU if auto-generate is enabled
      if (autoGenerateVariantSku) {
        generateVariantSku(selectedProduct.sku, {});
      }
    }
  }, [showVariantForm, selectedProduct, autoGenerateVariantSku]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Include products without variants for admin page so they can add variants
      const data = await ProductService.getProducts({ includeWithoutVariants: true });
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

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err.message);
      setCategories([]);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await StockService.getWarehouses();
      setWarehouses(data);
    } catch (err: any) {
      console.error('Failed to load warehouses:', err.message);
      setWarehouses([]);
    }
  };

  const loadVariants = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductService.getProductVariants(productId);
      console.log('Loaded variants data:', data); // Debug log
      // Ensure we have a valid array and filter out any invalid variants
      const validVariants = Array.isArray(data) ? data.filter(variant => variant && variant.id) : [];
      console.log('Valid variants:', validVariants); // Debug log
      setVariants(validVariants);
      
      // Load stock levels for this product
      await loadStockLevels(productId);
    } catch (err: any) {
      setError(err.message || 'Failed to load variants');
      setVariants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadStockLevels = async (productId: number) => {
    try {
      // Load all stock for the product (both parent product stock with variant_id = null and all variant stock)
      // Passing undefined means no variant filter, so we get all stock
      const data = await StockService.getStockByProduct(productId, undefined);
      setStockLevels(data);
    } catch (err: any) {
      console.error('Failed to load stock levels:', err.message);
      setStockLevels([]);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Validate sizes
      if (useMultipleSizes && selectedSizes.length === 0) {
        setError('Please select at least one size when using multiple sizes mode');
        setLoading(false);
        return;
      }
      if (!useMultipleSizes && !productForm.size) {
        setError('Please select a size');
        setLoading(false);
        return;
      }
      
      // Prepare product data - don't send SKU if auto-generating
      const productData: any = { ...productForm };
      if (autoGenerateSku) {
        delete productData.sku; // Let backend generate SKU
      }
      
      // If using multiple sizes, set the first size as the product size (for compatibility)
      if (useMultipleSizes && selectedSizes.length > 0) {
        productData.size = selectedSizes[0];
      }

      // Upload image first if selected
      if (imageFile) {
        const uploaded = await ProductService.uploadProductImage(imageFile);
        productData.image_url = uploaded.url;
      }
      
      const newProduct = await ProductService.createProduct(productData);
      setProducts([...products, newProduct]);
      
      // If multiple sizes are selected, create variants for each size
      if (useMultipleSizes && selectedSizes.length > 0) {
        try {
          const baseSku = newProduct.sku;
          for (const size of selectedSizes) {
            // Generate variant SKU
            const variantSku = `${baseSku}-${size.toUpperCase()}`;
            
            // Create variant for this size
            const variantData = {
              sku: variantSku,
              attributes: { size: size },
              additional_price: 0,
              active: 1,
              image_url: newProduct.image_url || undefined
            };
            
            const newVariant = await ProductService.createProductVariant(newProduct.id, variantData);
            
            // Add initial stock for this variant if specified
            if (productInitialWarehouseId && productInitialQty > 0) {
              try {
                await StockService.adjustStock({
                  product_id: newProduct.id,
                  variant_id: newVariant.id,
                  warehouse_id: Number(productInitialWarehouseId),
                  new_quantity: productInitialQty,
                  reason: 'Initial stock',
                  created_by: 'admin'
                });
              } catch (e) {
                console.error(`Initial stock for variant ${size} failed:`, (e as any)?.message || e);
              }
            }
          }
          
          // Reload variants and stock if this product is selected
          if (selectedProduct?.id === newProduct.id) {
            await loadVariants(newProduct.id);
          }
        } catch (e) {
          console.error('Failed to create variants for multiple sizes:', (e as any)?.message || e);
          setError(`Product created but failed to create some variants: ${(e as any)?.message || e}`);
        }
      } else {
        // Single size - optional initial stock for product (only if quantity > 0 and warehouse selected)
        if (productInitialWarehouseId && productInitialQty > 0) {
          try {
            await StockService.adjustStock({
              product_id: newProduct.id,
              variant_id: null,
              warehouse_id: Number(productInitialWarehouseId),
              new_quantity: productInitialQty,
              reason: 'Initial stock',
              created_by: 'admin'
            });
            // Reload stock levels if this product is currently selected
            if (selectedProduct?.id === newProduct.id) {
              await loadStockLevels(newProduct.id);
            }
          } catch (e) {
            console.error('Initial stock (product) failed:', (e as any)?.message || e);
          }
        }
      }
      
      setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1, size: '', is_jirani_recommended: 0, show_in_new_arrivals: 0 });
      setProductAttributePairs([{key: '', value: ''}]);
      setProductInitialWarehouseId('');
      setProductInitialQty(0);
      setUseMultipleSizes(false);
      setSelectedSizes([]);
      setImageFile(null);
      setImagePreview(null);
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
      const updateData: any = { ...productForm };
      
      // Preserve existing image_url if no new image is uploaded
      if (imageFile) {
        const uploaded = await ProductService.uploadProductImage(imageFile);
        updateData.image_url = uploaded.url;
      } else if (editingProduct.image_url) {
        // Preserve existing image if no new file is selected
        updateData.image_url = editingProduct.image_url;
      }
      
      // Ensure size is preserved (even if empty string, include it)
      updateData.size = productForm.size || null;
      
      const updatedProduct = await ProductService.updateProduct(editingProduct.id, updateData);
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1, size: '', is_jirani_recommended: 0, show_in_new_arrivals: 0 });
      setProductAttributePairs([{key: '', value: ''}]);
      setImageFile(null);
      setImagePreview(null);
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
      
      // Build attributes from attribute pairs
      const attributes: Record<string, any> = {};
      attributePairs.forEach(pair => {
        if (pair.key && pair.value && pair.key.trim() && pair.value.trim()) {
          attributes[pair.key.trim()] = pair.value.trim();
        }
      });
      
      // Prepare variant data
      const variantData = { 
        ...variantForm, 
        attributes,
        sku: autoGenerateVariantSku ? (generatedVariantSku || variantForm.sku) : variantForm.sku
      };
      
      // Validate required fields
      if (!variantData.sku.trim()) {
        setError('SKU is required for variant');
        return;
      }
      
      // Validate that size attribute is present and not empty (only for categories that require it)
      const requiresSize = selectedProduct ? productRequiresSize(selectedProduct) : false;
      if (requiresSize && (!attributes.size || !attributes.size.trim())) {
        setError(`Size is required for variants in the '${selectedProduct?.category_name}' category`);
        return;
      }
      
      // Validate size format if size is provided
      if (requiresSize && attributes.size && !validateSizeFormat(attributes.size, selectedProduct.category_name, selectedProduct.category)) {
        const sizeType = getSizeType(selectedProduct.category_name, selectedProduct.category);
        const sizeOptions = getSizeOptions(selectedProduct.category_name, selectedProduct.category);
        setError(`Invalid size format for ${selectedProduct.category_name}. Expected ${sizeType} sizes like: ${sizeOptions.slice(0, 5).join(', ')}...`);
        return;
      }
      
      console.log('Sending variant data:', variantData); // Debug log
      console.log('Attribute pairs:', attributePairs); // Debug log
      
      // Upload variant image if present
      if (variantImageFile) {
        const uploaded = await ProductService.uploadProductImage(variantImageFile);
        variantData.image_url = uploaded.url;
      }
      const newVariant = await ProductService.createProductVariant(selectedProduct.id, variantData);
      console.log('Received new variant:', newVariant); // Debug log
      setVariants([...variants, newVariant]);
      // Optional initial stock for variant (only if quantity > 0 and warehouse selected)
      if (variantInitialWarehouseId && variantInitialQty > 0 && selectedProduct) {
        try {
          await StockService.adjustStock({
            product_id: selectedProduct.id,
            variant_id: newVariant.id,
            warehouse_id: Number(variantInitialWarehouseId),
            new_quantity: variantInitialQty,
            reason: 'Initial stock',
            created_by: 'admin'
          });
        } catch (e) {
          console.error('Initial stock (variant) failed:', (e as any)?.message || e);
        }
      }
      setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
      setAttributePairs([{key: '', value: ''}]);
      setGeneratedVariantSku('');
      setVariantInitialWarehouseId('');
      setVariantInitialQty(0);
      setVariantImageFile(null);
      setVariantImagePreview(null);
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
      
      // Build attributes from attribute pairs
      const attributes: Record<string, any> = {};
      attributePairs.forEach(pair => {
        if (pair.key && pair.value && pair.key.trim() && pair.value.trim()) {
          attributes[pair.key.trim()] = pair.value.trim();
        }
      });
      
      // Prepare variant data
      const variantData = { 
        ...variantForm, 
        attributes
      };
      
      // Validate required fields
      if (!variantData.sku.trim()) {
        setError('SKU is required for variant');
        return;
      }
      
      // Validate that size attribute is present and not empty (only for categories that require it)
      const requiresSize = selectedProduct ? productRequiresSize(selectedProduct) : false;
      if (requiresSize && (!attributes.size || !attributes.size.trim())) {
        setError(`Size is required for variants in the '${selectedProduct?.category_name}' category`);
        return;
      }
      
      // Validate size format if size is provided
      if (requiresSize && attributes.size && !validateSizeFormat(attributes.size, selectedProduct?.category_name, selectedProduct?.category)) {
        const sizeType = getSizeType(selectedProduct?.category_name, selectedProduct?.category);
        const sizeOptions = getSizeOptions(selectedProduct?.category_name, selectedProduct?.category);
        setError(`Invalid size format for ${selectedProduct?.category_name}. Expected ${sizeType} sizes like: ${sizeOptions.slice(0, 5).join(', ')}...`);
        return;
      }
      
      console.log('Updating variant with data:', variantData); // Debug log
      
      // Upload variant image if present
      if (variantImageFile) {
        const uploaded = await ProductService.uploadProductImage(variantImageFile);
        variantData.image_url = uploaded.url;
      }
      const updatedVariant = await ProductService.updateProductVariant(editingVariant.id, variantData);
      setVariants(variants.map(v => v.id === editingVariant.id ? updatedVariant : v));
      setEditingVariant(null);
      setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
      setAttributePairs([{key: '', value: ''}]);
      setVariantImageFile(null);
      setVariantImagePreview(null);
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
      size: product.size || '',
      is_jirani_recommended: product.is_jirani_recommended || 0,
      show_in_new_arrivals: product.show_in_new_arrivals || 0,
    });
    setAutoGenerateSku(false); // When editing, allow manual SKU editing
    // Clear image file/preview so existing image is shown
    setImageFile(null);
    setImagePreview(null);
    // Reset initial stock fields (these are only for new products)
    setProductInitialWarehouseId('');
    setProductInitialQty(0);
    // Reset multiple sizes (only for new products)
    setUseMultipleSizes(false);
    setSelectedSizes([]);
  };

  const startEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      sku: variant.sku,
      attributes: variant.attributes || {},
      additional_price: variant.additional_price,
      active: variant.active,
    });
    
    // Convert attributes to key-value pairs
    const pairs = Object.entries(variant.attributes || {}).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    
    // Ensure size is always first if it exists and category requires it, otherwise add it
    const requiresSize = selectedProduct ? productRequiresSize(selectedProduct) : false;
    const sizePair = pairs.find(pair => pair.key === 'size');
    const otherPairs = pairs.filter(pair => pair.key !== 'size');
    
    if (requiresSize) {
      if (sizePair) {
        setAttributePairs([sizePair, ...otherPairs]);
      } else {
        setAttributePairs([{key: 'size', value: ''}, ...otherPairs]);
      }
    } else {
      setAttributePairs(pairs.length > 0 ? pairs : [{key: '', value: ''}]);
    }
    
    // When editing, allow manual SKU editing
    setAutoGenerateVariantSku(false);
    setGeneratedVariantSku('');
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditingVariant(null);
    setProductForm({ sku: '', name: '', description: '', category_id: 0, brand: '', price: 0, active: 1, size: '', is_jirani_recommended: 0, show_in_new_arrivals: 0 });
    setVariantForm({ sku: '', attributes: {}, additional_price: 0, active: 1 });
    setAttributePairs([{key: '', value: ''}]);
    setProductAttributePairs([{key: '', value: ''}]);
    setUseMultipleSizes(false);
    setSelectedSizes([]);
    setAutoGenerateSku(true);
    setAutoGenerateVariantSku(true);
    setGeneratedVariantSku('');
  };

  // Helper functions for attribute pairs
  const addAttributePair = () => {
    setAttributePairs([...attributePairs, {key: '', value: ''}]);
  };

  const removeAttributePair = (index: number) => {
    // Prevent removal of the first attribute if it's 'size' and category requires it
    const requiresSize = selectedProduct ? productRequiresSize(selectedProduct) : false;
    const isSizeField = attributePairs[index]?.key === 'size';
    
    if (attributePairs.length > 1 && !(index === 0 && isSizeField && requiresSize)) {
      setAttributePairs(attributePairs.filter((_, i) => i !== index));
    }
  };

  const updateAttributePair = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...attributePairs];
    
    // Prevent changing the 'size' key for the first attribute if category requires it
    const requiresSize = selectedProduct ? productRequiresSize(selectedProduct) : false;
    if (field === 'key' && index === 0 && updated[index].key === 'size' && requiresSize) {
      return; // Don't allow changing the size key
    }
    
    updated[index][field] = value;
    setAttributePairs(updated);
    
    // Update variantForm attributes - always update, even with empty values
    const attributes: Record<string, any> = {};
    updated.forEach(pair => {
      if (pair.key && pair.value && pair.key.trim() && pair.value.trim()) {
        attributes[pair.key.trim()] = pair.value.trim();
      }
    });
    
    console.log('Updated attributes:', attributes); // Debug log
    setVariantForm(prev => ({ ...prev, attributes }));
    
    // Generate SKU if auto-generation is enabled
    if (autoGenerateVariantSku && selectedProduct) {
      generateVariantSku(selectedProduct.sku, attributes);
    }
  };

  // Helper functions for product attribute pairs
  const addProductAttributePair = () => {
    setProductAttributePairs([...productAttributePairs, {key: '', value: ''}]);
  };

  const removeProductAttributePair = (index: number) => {
    if (productAttributePairs.length > 1) {
      setProductAttributePairs(productAttributePairs.filter((_, i) => i !== index));
    }
  };

  const updateProductAttributePair = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...productAttributePairs];
    updated[index][field] = value;
    setProductAttributePairs(updated);
  };

  const generateVariantSku = (productSku: string, attributes: Record<string, any>) => {
    // Use the existing product's SKU as base
    let baseSku = productSku;
    
    // Add attribute values to SKU
    const attributeValues = Object.values(attributes)
      .filter(value => value && String(value).trim())
      .map(value => String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3))
      .join('-');
    
    if (attributeValues) {
      baseSku += `-${attributeValues}`;
    }
    
    // Add timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-4);
    const generatedSku = `${baseSku}-${timestamp}`;
    
    setGeneratedVariantSku(generatedSku);
    setVariantForm({ ...variantForm, sku: generatedSku });
  };

  // Stock management functions
  const openStockModal = (variant: ProductVariant | null = null) => {
    setSelectedVariant(variant);
    setStockAdjustment({
      product_id: selectedProduct?.id || 0,
      variant_id: variant?.id || null,
      warehouse_id: warehouses[0]?.id || 0,
      new_quantity: 0,
      reason: '',
      created_by: 'admin'
    });
    setShowStockModal(true);
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);
      
      await StockService.adjustStock(stockAdjustment);
      
      // Reload stock levels
      await loadStockLevels(selectedProduct.id);
      
      setShowStockModal(false);
      setStockAdjustment({
        product_id: 0,
        variant_id: null,
        warehouse_id: 0,
        new_quantity: 0,
        reason: '',
        created_by: 'admin'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const getStockForVariant = (variantId: number | null) => {
    return stockLevels.filter(stock => 
      stock.variant_id === variantId && 
      stock.product_id === selectedProduct?.id
    );
  };

  const getTotalStockForProduct = () => {
    return stockLevels
      .filter(stock => stock.product_id === selectedProduct?.id)
      .reduce((total, stock) => total + stock.quantity_on_hand, 0);
  };

  useEffect(() => {
    if (!showImagePreview) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setShowImagePreview(false); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showImagePreview]);

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

        {/* Stock Summary removed per UX preference */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-black">Products</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by name, SKU, brand..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <span className="absolute right-2 top-2.5 text-gray-400 text-sm">⌕</span>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {products
                    .filter(product => product && product.id)
                    .filter(p => {
                      if (!productSearch.trim()) return true;
                      const q = productSearch.trim().toLowerCase();
                      return (
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.sku || '').toLowerCase().includes(q) ||
                        (p.brand || '').toLowerCase().includes(q)
                      );
                    })
                    .map((product, index) => {
                      // Check if this product has variants (only if it's selected)
                      const hasVariants = selectedProduct?.id === product.id ? variants.length > 0 : undefined;
                      
                      return (
                    <div
                      key={product.id || index}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedProduct?.id === product.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        } ${hasVariants === false ? 'border-yellow-300 bg-yellow-50' : ''}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3 flex-1">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-14 w-14 object-cover rounded cursor-pointer"
                              onClick={() => { setImagePreviewUrl(product.image_url!); setShowImagePreview(true); }}
                            />
                          )}
                            <div className="flex-1">
                            <div className="flex items-center gap-2">
                          <h3 className="font-medium text-black">{product.name || 'Unnamed Product'}</h3>
                              {hasVariants === false && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">
                                  No Variants
                                </span>
                              )}
                            </div>
                          <p className="text-sm text-black mt-1">{product.description || 'No description'}</p>
                          <p className="text-xs text-gray-600 mt-1">
                              SKU: {product.sku || 'N/A'} | Price: {Math.round(product.price || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} frw
                          </p>
                          <p className="text-xs text-gray-600">
                            Category: {product.category_name || 'N/A'} | Brand: {product.brand || 'N/A'}
                          </p>
                          </div>
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
                    );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 md:p-6 border-b border-gray-200">
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

            <div className="p-4 md:p-6">
              {!selectedProduct ? (
                <div className="text-center py-8 text-gray-600">
                  Select a product to view its variants
                </div>
              ) : loading ? (
                <div className="text-center py-4 text-black">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {/* Parent Product Stock Section - Always show for products */}
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-black mb-1">Product Stock</h3>
                        <p className="text-xs text-gray-600">
                          {variants.length > 0 
                            ? 'Stock for the base product (independent of variants)' 
                            : 'Stock for this product'}
                        </p>
                      </div>
                      <button
                        onClick={() => openStockModal(null)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Manage Stock
                      </button>
                    </div>
                    <div className="text-sm text-black mt-2">
                      <span className="font-medium">Stock:</span>
                      {getStockForVariant(null).length > 0 ? (
                        <div className="mt-1">
                          {getStockForVariant(null).map((stock) => (
                            <div key={stock.id} className="flex items-center space-x-2">
                              <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                {stock.warehouse_name}: {stock.quantity_on_hand} units
                              </span>
                              {stock.quantity_reserved > 0 && (
                                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                                  Reserved: {stock.quantity_reserved}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 ml-2">No stock assigned</span>
                      )}
                    </div>
                  </div>
                  {/* Variants Section */}
                  {variants.length > 0 && (
                    <div className="mb-2">
                      <h3 className="font-semibold text-black mb-2">Product Variants</h3>
                    </div>
                  )}
                  {variants.filter(variant => variant && variant.id).map((variant) => (
                    <div key={variant.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <img
                            src={variant.image_url}
                            alt={variant.sku}
                            className="h-12 w-12 object-cover rounded cursor-pointer"
                            onClick={() => { setImagePreviewUrl(variant.image_url!); setShowImagePreview(true); }}
                          />
                          <div>
                          <h3 className="font-medium text-black">SKU: {variant.sku}</h3>
                          <p className="text-sm text-black">
                            Additional Price: {Number(variant.additional_price || 0).toFixed(2)} frw
                          </p>
                          <div className="text-sm text-black">
                            <span className="font-medium">Attributes:</span>
                            {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
                              <div className="mt-1">
                                {Object.entries(variant.attributes).map(([key, value]) => {
                                  const isSizeField = key === 'size';
                                  const isRequired = isSizeField && selectedProduct && productRequiresSize(selectedProduct);
                                  return (
                                    <span 
                                      key={key} 
                                      className={`inline-block px-2 py-1 rounded text-xs mr-1 mb-1 ${
                                        isSizeField && isRequired
                                          ? 'bg-blue-100 text-blue-800 font-medium' 
                                          : 'bg-gray-100'
                                      }`}
                                    >
                                      {key}: {String(value)}
                                      {isSizeField && isRequired && <span className="ml-1 text-blue-600">*</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                          <div className="text-sm text-black mt-2">
                            <span className="font-medium">Stock:</span>
                            {getStockForVariant(variant.id).length > 0 ? (
                              <div className="mt-1">
                                {getStockForVariant(variant.id).map((stock) => (
                                  <div key={stock.id} className="flex items-center space-x-2">
                                    <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                      {stock.warehouse_name}: {stock.quantity_on_hand} units
                                    </span>
                                    {stock.quantity_reserved > 0 && (
                                      <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                                        Reserved: {stock.quantity_reserved}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">No stock</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            Status: {variant.active ? 'Active' : 'Inactive'}
                          </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
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
                          <button
                            onClick={() => openStockModal(variant)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Manage Stock
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
          <div className="fixed inset-0 text-black bg-black/70 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md my-auto max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </h3>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        setImagePreview(file ? URL.createObjectURL(file) : null);
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 h-24 w-24 object-cover rounded cursor-pointer"
                        onClick={() => {
                          setImagePreviewUrl(imagePreview!); setShowImagePreview(true);
                        }}
                      />
                    )}
                    {editingProduct?.image_url && !imagePreview && (
                      <img
                        src={editingProduct.image_url}
                        alt={editingProduct.name}
                        className="mt-2 h-24 w-24 object-cover rounded cursor-pointer"
                        onClick={() => {
                          setImagePreviewUrl(editingProduct.image_url!); setShowImagePreview(true);
                        }}
                      />
                    )}
                  </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="autoGenerateSku"
                        checked={autoGenerateSku}
                        onChange={(e) => setAutoGenerateSku(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="autoGenerateSku" className="text-sm font-medium text-black">
                        Auto-generate SKU
                      </label>
                    </div>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${
                        autoGenerateSku ? 'bg-gray-100 text-gray-500' : ''
                      }`}
                      disabled={autoGenerateSku}
                      placeholder={autoGenerateSku ? "SKU will be auto-generated from product name" : "Enter SKU"}
                    />
                    {autoGenerateSku && (
                      <p className="mt-1 text-xs text-gray-500">
                        SKU will be generated automatically based on the product name
                      </p>
                    )}
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
                      <label className="block text-sm font-medium text-black">Category</label>
                      <select
                        value={productForm.category_id || ''}
                        onChange={(e) => {
                          const selectedCategoryId = parseInt(e.target.value) || 0;
                          const selectedCategory = categories.find(c => c.id === selectedCategoryId);
                          setProductForm({ ...productForm, category_id: selectedCategoryId, size: '' });
                          // Clear selected sizes when category changes
                          setSelectedSizes([]);
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
                  {/* Size Selector - Always visible and required */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-black">
                        Size <span className="text-red-500">*</span>
                      </label>
                      {!editingProduct && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useMultipleSizes}
                            onChange={(e) => {
                              setUseMultipleSizes(e.target.checked);
                              if (!e.target.checked) {
                                setSelectedSizes([]);
                                // Set first selected size as product size if any were selected
                                if (selectedSizes.length > 0) {
                                  setProductForm({ ...productForm, size: selectedSizes[0] });
                                }
                              } else {
                                // If product has a size, add it to selected sizes
                                if (productForm.size) {
                                  setSelectedSizes([productForm.size]);
                                }
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-700">Add multiple sizes (creates variants)</span>
                        </label>
                      )}
                    </div>
                    {(() => {
                      const selectedCategory = categories.find(c => c.id === productForm.category_id);
                      let sizeOptions: string[] = [];
                      
                      if (selectedCategory) {
                        // Get size options from category
                        if (selectedCategory.size_options) {
                          if (Array.isArray(selectedCategory.size_options)) {
                            sizeOptions = selectedCategory.size_options;
                          } else if (typeof selectedCategory.size_options === 'string') {
                            try {
                              sizeOptions = JSON.parse(selectedCategory.size_options);
                            } catch {
                              sizeOptions = selectedCategory.size_options.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                            }
                          }
                        }
                        
                        // Use utility function as fallback if no size options from category
                        if (sizeOptions.length === 0) {
                          sizeOptions = getSizeOptions(selectedCategory.name, selectedCategory);
                        }
                      }
                      
                      // Default sizes if no category selected or no size options
                      if (sizeOptions.length === 0) {
                        sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
                      }
                      
                      if (useMultipleSizes && !editingProduct) {
                        // Multi-select for sizes
                        return (
                          <div>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                              {sizeOptions.map((size: string) => (
                                <label key={size} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedSizes.includes(size)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSizes([...selectedSizes, size]);
                                      } else {
                                        setSelectedSizes(selectedSizes.filter(s => s !== size));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm text-black">{size}</span>
                                </label>
                              ))}
                            </div>
                            {selectedSizes.length > 0 && (
                              <p className="mt-2 text-xs text-blue-700 font-medium">
                                {selectedSizes.length} size{selectedSizes.length > 1 ? 's' : ''} selected: {selectedSizes.join(', ')}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-600">
                              <span className="text-red-500">*</span> Select one or more sizes. Variants will be created automatically for each selected size.
                            </p>
                          </div>
                        );
                      } else {
                        // Single select for size
                        return (
                          <>
                            <select
                              value={productForm.size || ''}
                              onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                              required={!useMultipleSizes}
                            >
                              <option value="">Select size</option>
                              {sizeOptions.map((size: string) => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-600">
                              <span className="text-red-500">*</span> Size is required. This allows the product to be purchased without variants.
                            </p>
                          </>
                        );
                      }
                    })()}
                  </div>
                  {/* Product Attributes */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Product Attributes</label>
                    <div className="space-y-2">
                      {productAttributePairs.map((pair, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Key (e.g., color)"
                            value={pair.key}
                            onChange={(e) => updateProductAttributePair(index, 'key', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g., red)"
                            value={pair.value}
                            onChange={(e) => updateProductAttributePair(index, 'value', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                          {productAttributePairs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProductAttributePair(index)}
                              className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addProductAttributePair}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Attribute
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Add key-value pairs for product attributes (e.g., color: red, material: cotton).
                    </p>
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
                  {/* Optional initial stock for new product only */}
                  {!editingProduct && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black">Initial Warehouse (optional)</label>
                        <select
                          value={productInitialWarehouseId}
                          onChange={(e) => setProductInitialWarehouseId(e.target.value ? Number(e.target.value) : '')}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">Select warehouse</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black">Initial Quantity (optional)</label>
                        <input
                          type="number"
                          min={0}
                          value={productInitialQty}
                          onChange={(e) => setProductInitialQty(parseInt(e.target.value) || 0)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}
                  {editingProduct && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> To manage stock for this product, use the "Manage Stock" button after closing this form.
                      </p>
                    </div>
                  )}
                  {/* Product Flags */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_jirani_recommended"
                        checked={productForm.is_jirani_recommended === 1}
                        onChange={(e) => setProductForm({ ...productForm, is_jirani_recommended: e.target.checked ? 1 : 0 })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_jirani_recommended" className="ml-2 block text-sm font-medium text-black">
                        💎 Mark as Jirani Recommended (Show in Jirani Picks)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="show_in_new_arrivals"
                        checked={productForm.show_in_new_arrivals === 1}
                        onChange={(e) => setProductForm({ ...productForm, show_in_new_arrivals: e.target.checked ? 1 : 0 })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="show_in_new_arrivals" className="ml-2 block text-sm font-medium text-black">
                        ✨ Show in New Arrivals
                      </label>
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md my-auto max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingVariant ? 'Edit Variant' : 'Create Variant'}
                {selectedProduct && !editingVariant && ` for ${selectedProduct.name}`}
              </h3>
              {selectedProduct && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">Category: {selectedProduct.category_name}</div>
                    {(() => {
                      const sizeInfo = getCategorySizeInfo(selectedProduct);
                      if (sizeInfo) {
                        return (
                          <div className="mt-1">
                            <div className="text-blue-700">
                              <span className="font-medium">Size Required:</span> Yes
                              {sizeInfo.sizeType && (
                                <span className="ml-2">
                                  ({sizeInfo.sizeType === 'numeric' ? 'Numeric' : 'Letter'} sizes)
                                </span>
                              )}
                            </div>
                            {sizeInfo.sizeOptions.length > 0 && (
                              <div className="mt-1 text-xs text-gray-600">
                                Available sizes: {sizeInfo.sizeOptions.slice(0, 5).join(', ')}
                                {sizeInfo.sizeOptions.length > 5 && ` +${sizeInfo.sizeOptions.length - 5} more`}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="mt-1 text-gray-600">Size Required: No</div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
              <form onSubmit={editingVariant ? handleUpdateVariant : handleCreateVariant}>
                <div className="space-y-4">
                  {/* Size Selector - Show prominently if category requires size */}
                  {selectedProduct && (() => {
                    const requiresSize = productRequiresSize(selectedProduct);
                    const sizeInfo = getCategorySizeInfo(selectedProduct);
                    return requiresSize && sizeInfo ? (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm font-semibold text-black mb-2">
                          Size <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={attributePairs.find(p => p.key === 'size')?.value || ''}
                          onChange={(e) => {
                            const sizeIndex = attributePairs.findIndex(p => p.key === 'size');
                            if (sizeIndex >= 0) {
                              updateAttributePair(sizeIndex, 'value', e.target.value);
                            } else {
                              // Add size pair if it doesn't exist
                              setAttributePairs([{key: 'size', value: e.target.value}, ...attributePairs]);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                          required
                        >
                          <option value="">Select size</option>
                          {sizeInfo.sizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-600">
                          Select the size for this variant. Available sizes: {sizeInfo.sizeOptions.slice(0, 5).join(', ')}
                          {sizeInfo.sizeOptions.length > 5 && ` +${sizeInfo.sizeOptions.length - 5} more`}
                        </p>
                      </div>
                    ) : null;
                  })()}
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="autoGenerateVariantSku"
                        checked={autoGenerateVariantSku}
                        onChange={(e) => {
                          setAutoGenerateVariantSku(e.target.checked);
                          if (e.target.checked && selectedProduct) {
                            generateVariantSku(selectedProduct.sku, variantForm.attributes);
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor="autoGenerateVariantSku" className="text-sm font-medium text-black">
                        Auto-generate SKU from product SKU and attributes
                      </label>
                    </div>
                    <input
                      type="text"
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${
                        autoGenerateVariantSku ? 'bg-gray-100 text-gray-500' : ''
                      }`}
                      disabled={autoGenerateVariantSku}
                      placeholder={autoGenerateVariantSku ? "SKU will be auto-generated" : "Enter SKU"}
                    />
                    {autoGenerateVariantSku && generatedVariantSku && (
                      <p className="mt-1 text-xs text-gray-500">
                        Generated SKU: <span className="font-mono bg-gray-200 px-1 rounded">{generatedVariantSku}</span>
                        <br />
                        <span className="text-gray-400">Based on product SKU: {selectedProduct?.sku}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Additional Price (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variantForm.additional_price || ''}
                        onChange={(e) => setVariantForm({ ...variantForm, additional_price: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Variant Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setVariantImageFile(file);
                        setVariantImagePreview(file ? URL.createObjectURL(file) : null);
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {variantImagePreview && (
                      <img
                        src={variantImagePreview}
                        alt="Preview"
                        className="mt-2 h-24 w-24 object-cover rounded cursor-pointer"
                        onClick={() => {
                          setImagePreviewUrl(variantImagePreview!); setShowImagePreview(true);
                        }}
                      />
                    )}
                    {editingVariant?.image_url && (
                      <img
                        src={editingVariant.image_url}
                        alt={editingVariant.sku}
                        className="mt-2 h-24 w-24 object-cover rounded cursor-pointer"
                        onClick={() => {
                          setImagePreviewUrl(editingVariant.image_url!); setShowImagePreview(true);
                        }}
                      />
                    )}
                  </div>
                  {/* Optional initial stock for new variant */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black">Initial Warehouse (optional)</label>
                      <select
                        value={variantInitialWarehouseId}
                        onChange={(e) => setVariantInitialWarehouseId(e.target.value ? Number(e.target.value) : '')}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select warehouse</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Initial Quantity (optional)</label>
                      <input
                        type="number"
                        min={0}
                        value={variantInitialQty}
                        onChange={(e) => setVariantInitialQty(parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Additional Attributes {selectedProduct && productRequiresSize(selectedProduct) && <span className="text-gray-400 text-xs">(optional)</span>}
                    </label>
                    <div className="space-y-2">
                      {attributePairs
                        .map((pair, originalIndex) => ({ pair, originalIndex }))
                        .filter(({ pair }) => pair.key !== 'size' || !productRequiresSize(selectedProduct!))
                        .map(({ pair, originalIndex }, displayIndex) => {
                        return (
                            <div key={originalIndex} className="flex space-x-2">
                            <input
                              type="text"
                                placeholder="Key (e.g., color)"
                              value={pair.key}
                                onChange={(e) => updateAttributePair(originalIndex, 'key', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g., red)"
                                value={pair.value}
                                onChange={(e) => updateAttributePair(originalIndex, 'value', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                              />
                              {attributePairs.filter(p => p.key !== 'size' || !productRequiresSize(selectedProduct!)).length > 1 && (
                              <button
                                type="button"
                                  onClick={() => removeAttributePair(originalIndex)}
                                className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addAttributePair}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Attribute
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedProduct && productRequiresSize(selectedProduct) ? (
                        <>
                          <span className="text-red-500">*</span> Size is required for variants in the '{selectedProduct?.category_name}' category. 
                          {selectedProduct?.category_name && (
                            <>
                              {' '}Use {getSizeType(selectedProduct.category_name, selectedProduct.category)} sizes: {getSizeOptions(selectedProduct.category_name, selectedProduct.category).slice(0, 3).join(', ')}...
                            </>
                          )}
                          {' '}Add additional attributes as needed (e.g., color: red).
                        </>
                      ) : (
                        <>Add key-value pairs for variant attributes (e.g., color: red, material: cotton).</>
                      )}
                    </p>
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

        {/* Stock Adjustment Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {selectedVariant ? `Adjust Stock - ${selectedVariant.sku}` : `Adjust Stock - ${selectedProduct?.name}`}
              </h3>
              <form onSubmit={handleStockAdjustment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Warehouse</label>
                    <select
                      value={stockAdjustment.warehouse_id}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, warehouse_id: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">New Quantity</label>
                    <input
                      type="number"
                      value={stockAdjustment.new_quantity}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, new_quantity: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Reason</label>
                    <input
                      type="text"
                      value={stockAdjustment.reason}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., Initial stock, Purchase order, Adjustment"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Adjusting...' : 'Adjust Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showImagePreview && imagePreviewUrl && (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/80 z-[999] cursor-pointer"
    onClick={() => setShowImagePreview(false)}
  >
    <img
      src={imagePreviewUrl}
      alt="Preview"
      className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg outline outline-2 outline-white"
      onClick={e => e.stopPropagation()}
    />
    <button
      className="absolute top-2 right-2 bg-white text-black rounded-full px-4 py-2 shadow-lg text-lg font-bold"
      onClick={() => setShowImagePreview(false)}
    >✕</button>
  </div>
)}
      </div>
    </div>
  );
}
