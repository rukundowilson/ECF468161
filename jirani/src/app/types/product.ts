export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  brand?: string;
  price: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  attributes: Record<string, any> | null;
  additional_price: number;
  active: number;
  created_at: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  category_id: number;
  brand?: string;
  price: number;
  active?: number;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  category_id?: number;
  brand?: string;
  price?: number;
  active?: number;
}

export interface CreateProductVariantRequest {
  sku: string;
  attributes: Record<string, any>;
  additional_price: number;
  active?: number;
}

export interface UpdateProductVariantRequest {
  sku?: string;
  attributes?: Record<string, any>;
  additional_price?: number;
  active?: number;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
