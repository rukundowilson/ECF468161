# API Configuration Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Replace `http://localhost:3001` with your actual backend API URL.

## API Configuration

The axios configuration is set up in `src/app/config/api.ts` with the following features:

- **Base URL**: Configurable via environment variable `NEXT_PUBLIC_API_URL`
- **Timeout**: 10 seconds
- **Request Interceptor**: Automatically adds auth token from localStorage
- **Response Interceptor**: Handles common errors like 401 unauthorized

## Usage

Import the API instance in your components:

```typescript
import API from '../config/api';

// Make API calls
const response = await API.get('/api/products');
const data = await API.post('/api/products', productData);
```

## Product Service

The `ProductService` class provides methods for all product-related operations:

### Products
- `getProducts(filters?)` - Get all products with optional filters
- `getProductById(id)` - Get product by ID
- `createProduct(data)` - Create new product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Delete product

### Product Variants
- `getProductVariants(productId)` - Get variants for a product
- `createProductVariant(productId, data)` - Create new variant
- `updateProductVariant(variantId, data)` - Update variant
- `deleteProductVariant(variantId)` - Delete variant

## Example Usage

```typescript
import { ProductService } from '../services/productService';

// Get all products
const products = await ProductService.getProducts();

// Create a new product
const newProduct = await ProductService.createProduct({
  name: 'New Product',
  description: 'Product description',
  categoryId: 'category-id'
});

// Get product variants
const variants = await ProductService.getProductVariants('product-id');
```
