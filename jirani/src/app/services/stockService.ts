import API from '../config/api';
import {
  Stock,
  StockMovement,
  Warehouse,
  StockAdjustmentRequest,
  StockTransferRequest,
  StockReservationRequest,
  StockFilters,
} from '../types/stock';

export class StockService {
  // Stock Levels
  static async getStockLevels(filters?: StockFilters): Promise<Stock[]> {
    const params = new URLSearchParams();
    if (filters?.warehouse_id) params.append('warehouse_id', filters.warehouse_id.toString());
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.low_stock_only) params.append('low_stock_only', 'true');

    const response = await API.get(`/api/stock/levels?${params.toString()}`);
    return response.data.data || [];
  }

  static async getStockByWarehouse(warehouseId: number): Promise<Stock[]> {
    const response = await API.get(`/api/stock/levels/warehouse/${warehouseId}`);
    return response.data.data || [];
  }

  static async getStockByProduct(productId: number, variantId?: number): Promise<Stock[]> {
    const params = new URLSearchParams();
    if (variantId) params.append('variant_id', variantId.toString());
    
    const response = await API.get(`/api/stock/levels/product/${productId}?${params.toString()}`);
    return response.data.data || [];
  }

  static async getLowStock(warehouseId?: number): Promise<Stock[]> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId.toString());
    
    const response = await API.get(`/api/stock/low-stock?${params.toString()}`);
    return response.data.data || [];
  }

  // Stock Operations
  static async adjustStock(adjustment: StockAdjustmentRequest): Promise<any> {
    const response = await API.post('/api/stock/adjust', adjustment);
    return response.data.data;
  }

  static async transferStock(transfer: StockTransferRequest): Promise<any> {
    const response = await API.post('/api/stock/transfer', transfer);
    return response.data.data;
  }

  static async reserveStock(reservation: StockReservationRequest): Promise<any> {
    const response = await API.post('/api/stock/reserve', reservation);
    return response.data.data;
  }

  static async releaseStock(reservation: StockReservationRequest): Promise<any> {
    const response = await API.post('/api/stock/release', reservation);
    return response.data.data;
  }

  // Stock Movements
  static async getMovements(limit: number = 50): Promise<StockMovement[]> {
    const response = await API.get(`/api/stock/movements?limit=${limit}`);
    return response.data.data || [];
  }

  static async getMovementsByStock(stockId: number): Promise<StockMovement[]> {
    const response = await API.get(`/api/stock/movements/stock/${stockId}`);
    return response.data.data || [];
  }

  static async getMovementsByType(type: string, limit: number = 100): Promise<StockMovement[]> {
    const response = await API.get(`/api/stock/movements/type/${type}?limit=${limit}`);
    return response.data.data || [];
  }

  static async getMovementStats(warehouseId?: number, days: number = 30): Promise<any> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId.toString());
    params.append('days', days.toString());
    
    const response = await API.get(`/api/stock/movements/stats?${params.toString()}`);
    return response.data.data;
  }

  // Warehouses
  static async getWarehouses(): Promise<Warehouse[]> {
    const response = await API.get('/api/warehouses');
    return response.data.data || [];
  }

  static async getDefaultWarehouse(): Promise<Warehouse> {
    const response = await API.get('/api/warehouses/default');
    return response.data.data;
  }

  static async getWarehouseById(id: number): Promise<Warehouse> {
    const response = await API.get(`/api/warehouses/${id}`);
    return response.data.data;
  }

  static async createWarehouse(warehouse: Omit<Warehouse, 'id' | 'created_at'>): Promise<Warehouse> {
    const response = await API.post('/api/warehouses', warehouse);
    return response.data.data;
  }

  static async updateWarehouse(id: number, warehouse: Partial<Warehouse>): Promise<Warehouse> {
    const response = await API.put(`/api/warehouses/${id}`, warehouse);
    return response.data.data;
  }

  static async deleteWarehouse(id: number): Promise<void> {
    await API.delete(`/api/warehouses/${id}`);
  }
}

