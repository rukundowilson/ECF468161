'use client';

import { useState, useEffect } from 'react';
import { CategoryService } from '../services/categoryService';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to safely parse JSON
  const safeParseJSON = (jsonString: string | null): string[] => {
    if (!jsonString) return [];
    
    // Handle case where jsonString might already be an array
    if (Array.isArray(jsonString)) {
      return jsonString;
    }
    
    // Trim whitespace and check if it's a valid JSON string
    const trimmed = jsonString.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing JSON:', error, 'Input:', jsonString);
      return [];
    }
  };

  // Form states
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    requires_size: 0,
    size_type: null,
    size_options: []
  });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const newCategory = await CategoryService.createCategory(categoryForm);
      setCategories([...categories, newCategory]);
      setCategoryForm({ name: '', description: '', requires_size: 0, size_type: null, size_options: [] });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setLoading(true);
      setError(null);
      const updatedCategory = await CategoryService.updateCategory(editingCategory.id, categoryForm);
      setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c));
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', requires_size: 0, size_type: null, size_options: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all products in this category.')) return;

    try {
      setLoading(true);
      setError(null);
      await CategoryService.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      requires_size: category.requires_size,
      size_type: category.size_type,
      size_options: safeParseJSON(category.size_options)
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', requires_size: 0, size_type: null, size_options: [] });
  };

  const handleSizeTypeChange = (sizeType: 'numeric' | 'letter' | null) => {
    setCategoryForm(prev => ({
      ...prev,
      size_type: sizeType,
      size_options: sizeType === 'numeric' 
        ? ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13']
        : sizeType === 'letter'
        ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
        : []
    }));
  };

  const addSizeOption = () => {
    setCategoryForm(prev => ({
      ...prev,
      size_options: [...(prev.size_options || []), '']
    }));
  };

  const removeSizeOption = (index: number) => {
    setCategoryForm(prev => ({
      ...prev,
      size_options: prev.size_options?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSizeOption = (index: number, value: string) => {
    setCategoryForm(prev => ({
      ...prev,
      size_options: prev.size_options?.map((option, i) => i === index ? value : option) || []
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Categories Management</h1>
              <p className="text-black mt-2">Manage product categories and their size requirements</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-black">Categories</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <span className="absolute right-2 top-2.5 text-gray-400 text-sm">⌕</span>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 whitespace-nowrap"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <>
                {categories.filter(c => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
                }).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? `No categories found matching "${searchQuery}"` : 'No categories yet. Create your first category!'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories
                      .filter(c => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
                      })
                      .map((category) => (
                  <div key={category.id} className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-black text-lg pr-2">{category.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 min-h-[2.5rem]">
                      {category.description || <span className="italic text-gray-400">No description</span>}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Size Required:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          category.requires_size ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {category.requires_size ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {category.requires_size && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Size Type:</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              {category.size_type || 'Not set'}
                            </span>
                          </div>
                          
                          {category.size_options && (
                            <div>
                              <span className="text-sm font-medium text-gray-700 block mb-1">Size Options:</span>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {(() => {
                                  const sizeOptions = safeParseJSON(category.size_options);
                                  if (sizeOptions.length === 0) {
                                    return <span className="text-xs text-gray-500 italic">No size options</span>;
                                  }
                                  return sizeOptions.slice(0, 5).map((size: string, index: number) => (
                                    <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                                      {size}
                                    </span>
                                  ));
                                })()}
                                {(() => {
                                  const sizeOptions = safeParseJSON(category.size_options);
                                  return sizeOptions.length > 5 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200 font-medium">
                                      +{sizeOptions.length - 5} more
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                 ))}
               </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create/Edit Category Modal */}
        {(showCreateForm || editingCategory) && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black">Description</label>
                    <textarea
                      value={categoryForm.description || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="requiresSize"
                        checked={categoryForm.requires_size === 1}
                        onChange={(e) => {
                          const requiresSize = e.target.checked ? 1 : 0;
                          setCategoryForm({ 
                            ...categoryForm, 
                            requires_size: requiresSize,
                            size_type: requiresSize ? categoryForm.size_type : null,
                            size_options: requiresSize ? categoryForm.size_options : []
                          });
                        }}
                        className="rounded"
                      />
                      <label htmlFor="requiresSize" className="text-sm font-medium text-black">
                        Products in this category require size variants
                      </label>
                    </div>
                  </div>

                  {categoryForm.requires_size === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-black">Size Type</label>
                        <select
                          value={categoryForm.size_type || ''}
                          onChange={(e) => handleSizeTypeChange(e.target.value as 'numeric' | 'letter' | null)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Select size type</option>
                          <option value="numeric">Numeric (Shoes: 6, 7, 8, etc.)</option>
                          <option value="letter">Letter (Clothing: S, M, L, etc.)</option>
                        </select>
                      </div>

                      {categoryForm.size_type && (
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Size Options
                          </label>
                          <div className="space-y-2">
                            {categoryForm.size_options?.map((option, index) => (
                              <div key={index} className="flex space-x-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateSizeOption(index, e.target.value)}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                  placeholder={`Size option ${index + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSizeOption(index)}
                                  className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addSizeOption}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              + Add Size Option
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Add all possible size options for this category (e.g., 6, 6.5, 7 for shoes or S, M, L for clothing)
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
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
