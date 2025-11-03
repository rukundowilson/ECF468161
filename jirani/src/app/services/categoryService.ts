import API from '../config/api';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category';

export class CategoryService {
  // Get all categories
  static async getCategories(): Promise<Category[]> {
    const response = await API.get('/api/categories');
    return response.data.data || [];
  }

  // Get category by ID
  static async getCategoryById(id: number): Promise<Category> {
    const response = await API.get(`/api/categories/${id}`);
    return response.data.data;
  }

  // Create new category
  static async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    const response = await API.post('/api/categories', categoryData);
    return response.data.data;
  }

  // Update category
  static async updateCategory(id: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    const response = await API.put(`/api/categories/${id}`, categoryData);
    return response.data.data;
  }

  // Delete category
  static async deleteCategory(id: number): Promise<void> {
    await API.delete(`/api/categories/${id}`);
  }
}


