// Utility functions for category-related operations
// 
// IMPORTANT: This file has been updated to prioritize database settings over hardcoded values.
// 
// PRIMARY SOURCE OF TRUTH: Database fields
// - requires_size: number - Whether products need size variants
// - size_type: 'numeric' | 'letter' | null - Type of sizes used
// - size_options: string | null - Available size options array (JSON)
//
// FALLBACK: Hardcoded arrays below are only used when:
// 1. Database settings are not available
// 2. Backward compatibility is needed
// 3. Category object is not passed to functions
//
// RECOMMENDATION: Always pass the full category object to these functions
// for the most accurate and up-to-date behavior.

/**
 * Fallback categories that require size attributes for their variants
 * Used only when database settings are not available
 */
const FALLBACK_SIZE_REQUIRED_CATEGORIES = [
  'clothing',
  'shoes',
  'apparel',
  'footwear',
  'garments',
  'attire'
];

/**
 * Fallback categories that use numeric sizes (shoes, etc.)
 * Used only when database settings are not available
 */
const FALLBACK_NUMERIC_SIZE_CATEGORIES = [
  'shoes',
  'footwear',
  'sneakers',
  'boots',
  'sandals',
  'heels'
];

/**
 * Fallback categories that use letter sizes (clothing, etc.)
 * Used only when database settings are not available
 */
const FALLBACK_LETTER_SIZE_CATEGORIES = [
  'clothing',
  'apparel',
  'garments',
  'attire',
  'shirts',
  'pants',
  'dresses',
  'tops',
  'bottoms'
];

/**
 * Check if a category requires size attributes for variants
 * @param categoryName - The name of the category
 * @param category - The category object with database settings
 * @returns True if size is required, false otherwise
 */
export function requiresSize(categoryName: string | undefined, category?: { requires_size?: number }): boolean {
  // If we have a category object with database settings, use those
  if (category && category.requires_size !== undefined) {
    return category.requires_size === 1;
  }
  
  // Fallback to name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_SIZE_REQUIRED_CATEGORIES.some(requiredCategory => 
    normalizedName.includes(requiredCategory) || 
    requiredCategory.includes(normalizedName)
  );
}

/**
 * Get a list of categories that require size
 * @returns Array of category names that require size
 */
export function getSizeRequiredCategories(): string[] {
  return [...FALLBACK_SIZE_REQUIRED_CATEGORIES];
}

/**
 * Check if a product requires size based on its category
 * @param product - The product object
 * @returns True if size is required, false otherwise
 */
export function productRequiresSize(product: { category_name?: string; category?: { requires_size?: number } }): boolean {
  return requiresSize(product?.category_name, product?.category);
}

/**
 * Check if a category uses numeric sizes (shoes, etc.)
 * @param categoryName - The name of the category
 * @returns True if numeric sizes are used, false otherwise
 */
export function usesNumericSizes(categoryName: string | undefined, category?: { size_type?: string }): boolean {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    return category.size_type === 'numeric';
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_NUMERIC_SIZE_CATEGORIES.some(fallbackCategory => 
    normalizedName.includes(fallbackCategory) || 
    fallbackCategory.includes(normalizedName)
  );
}

/**
 * Check if a category uses letter sizes (clothing, etc.)
 * @param categoryName - The name of the category
 * @returns True if letter sizes are used, false otherwise
 */
export function usesLetterSizes(categoryName: string | undefined, category?: { size_type?: string }): boolean {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    return category.size_type === 'letter';
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_LETTER_SIZE_CATEGORIES.some(fallbackCategory => 
    normalizedName.includes(fallbackCategory) || 
    fallbackCategory.includes(normalizedName)
  );
}

/**
 * Get size type for a category
 * @param categoryName - The name of the category
 * @returns 'numeric', 'letter', or 'none'
 */
export function getSizeType(categoryName: string | undefined, category?: { size_type?: string }): 'numeric' | 'letter' | 'none' {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    const sizeType = category.size_type.toLowerCase();
    if (sizeType === 'numeric' || sizeType === 'letter') {
      return sizeType as 'numeric' | 'letter';
    }
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (usesNumericSizes(categoryName)) return 'numeric';
  if (usesLetterSizes(categoryName)) return 'letter';
  return 'none';
}

/**
 * Get suggested size options for a category
 * @param categoryName - The name of the category
 * @returns Array of suggested size options
 */
export function getSizeOptions(categoryName: string | undefined, category?: { size_options?: string | null }): string[] {
  // Primary: Use database settings if available
  if (category && category.size_options) {
    if (Array.isArray(category.size_options)) {
      // Already an array
      return category.size_options;
    } else if (typeof category.size_options === 'string') {
      try {
        // Try to parse as JSON first
        return JSON.parse(category.size_options);
      } catch (error) {
        // If JSON parsing fails, try to split by comma (fallback for old format)
        try {
          const sizeOptions = category.size_options.split(',').map(option => option.trim()).filter(option => option.length > 0);
          if (sizeOptions.length > 0) {
            return sizeOptions;
          }
        } catch (splitError) {
          console.error('Error parsing size options:', splitError);
        }
      }
    }
  }
  
  // Fallback: Use hardcoded defaults for backward compatibility
  if (usesNumericSizes(categoryName)) {
    return ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'];
  }
  if (usesLetterSizes(categoryName)) {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  }
  return [];
}

/**
 * Validate size format for a category
 * @param size - The size value
 * @param categoryName - The name of the category
 * @returns True if size format is valid, false otherwise
 */
export function validateSizeFormat(size: string, categoryName: string | undefined, category?: { size_type?: string }): boolean {
  if (!size || !size.trim()) return false;
  
  const sizeValue = size.trim().toUpperCase();
  
  if (usesNumericSizes(categoryName, category)) {
    // Numeric sizes: 6, 6.5, 7, etc.
    return /^\d+(\.\d+)?$/.test(sizeValue);
  }
  
  if (usesLetterSizes(categoryName, category)) {
    // Letter sizes: XS, S, M, L, XL, XXL, XXXL, etc.
    // Match: S, M, L, XS, XL, XXS, XXL, XXXS, XXXL, etc.
    return /^X*[SML]$/.test(sizeValue);
  }
  
  return true; // For categories that don't require specific format
}
