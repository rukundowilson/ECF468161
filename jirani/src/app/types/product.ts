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
  image_url?: string;
  is_jirani_recommended?: number;
  show_in_new_arrivals?: number;
  created_at: string;
  updated_at: string;
  category?: {
    requires_size?: number;
    size_type?: string;
    size_options?: string;
  };
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  attributes: Record<string, any> | null;
  additional_price: number;
  image_url?: string;
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
  image_url?: string;
  is_jirani_recommended?: number;
  show_in_new_arrivals?: number;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  category_id?: number;
  brand?: string;
  price?: number;
  active?: number;
  image_url?: string;
  is_jirani_recommended?: number;
  show_in_new_arrivals?: number;
}

export interface CreateProductVariantRequest {
  sku: string;
  attributes: Record<string, any>;
  additional_price: number;
  image_url?: string;
  active?: number;
}

export interface UpdateProductVariantRequest {
  sku?: string;
  attributes?: Record<string, any>;
  additional_price?: number;
  image_url?: string;
  active?: number;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
  includeWithoutVariants?: boolean;
}
