export interface Stock {
  id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  min_reorder_level: number;
  last_cost: number | null;
  updated_at: string;
  product_name?: string;
  product_sku?: string;
  variant_sku?: string;
  warehouse_name?: string;
}

export interface StockMovement {
  id: number;
  stock_id: number;
  change_qty: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';
  reference: string | null;
  created_by: string | null;
  created_at: string;
  note: string | null;
  product_name?: string;
  warehouse_name?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export interface StockAdjustmentRequest {
  product_id: number;
  variant_id?: number | null;
  warehouse_id: number;
  new_quantity: number;
  reason: string;
  created_by: string;
}

export interface StockTransferRequest {
  product_id: number;
  variant_id?: number | null;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
  reference: string;
  created_by: string;
}

export interface StockReservationRequest {
  product_id: number;
  variant_id?: number | null;
  warehouse_id: number;
  quantity: number;
  reference: string;
  created_by: string;
}

export interface StockFilters {
  warehouse_id?: number;
  product_id?: number;
  low_stock_only?: boolean;
}

