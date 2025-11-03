export interface Category {
  id: number;
  name: string;
  description: string;
  requires_size: number;
  size_type: 'numeric' | 'letter' | null;
  size_options: string | null; // JSON string from database
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  requires_size?: number;
  size_type?: 'numeric' | 'letter' | null;
  size_options?: string[];
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  requires_size?: number;
  size_type?: 'numeric' | 'letter' | null;
  size_options?: string[];
}


