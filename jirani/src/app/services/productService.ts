import API from '../config/api';
import {
  Product,
  ProductVariant,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
  ProductFilters,
} from '../types/product';

export class ProductService {
  // Image upload
  static async uploadProductImage(file: File): Promise<{ url: string }>{
    const formData = new FormData();
    formData.append('image', file);
    const response = await API.post('/api/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  // Products CRUD operations
  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('category_id', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    // Include products without variants for admin pages
    if (filters?.includeWithoutVariants) params.append('includeWithoutVariants', 'true');

    const response = await API.get(`/api/products?${params.toString()}`);
    return response.data.data || [];
  }

  static async getProductById(id: number): Promise<Product> {
    const response = await API.get(`/api/products/${id}`);
    return response.data.data;
  }

  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    const response = await API.post('/api/products', productData);
    return response.data.data;
  }

  static async updateProduct(id: number, productData: UpdateProductRequest): Promise<Product> {
    const response = await API.put(`/api/products/${id}`, productData);
    return response.data.data;
  }

  static async deleteProduct(id: number): Promise<void> {
    await API.delete(`/api/products/${id}`);
  }

  // Product Variants operations
  static async getProductVariants(productId: number): Promise<ProductVariant[]> {
    const response = await API.get(`/api/products/${productId}/variants`);
    return response.data.data || [];
  }

  static async createProductVariant(
    productId: number,
    variantData: CreateProductVariantRequest
  ): Promise<ProductVariant> {
    const response = await API.post(`/api/products/${productId}/variants`, variantData);
    return response.data.data;
  }

  static async updateProductVariant(
    variantId: number,
    variantData: UpdateProductVariantRequest
  ): Promise<ProductVariant> {
    const response = await API.put(`/api/products/variants/${variantId}`, variantData);
    return response.data.data;
  }

  static async deleteProductVariant(variantId: number): Promise<void> {
    await API.delete(`/api/products/variants/${variantId}`);
  }

  // Get total product quantity (sum of all variant quantities)
  static async getProductTotalQuantity(productId: number): Promise<{
    total_quantity: number;
    total_available: number;
    variant_count: number;
  }> {
    const response = await API.get(`/api/products/${productId}/quantity`);
    return response.data.data;
  }
}
