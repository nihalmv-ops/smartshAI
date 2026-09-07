import api from './api';
import { products as localProducts } from '../data/products';
import { categories as localCategories } from '../data/categories';

// Helper to normalize product object so both _id and id are accessible
const normalizeProduct = (p) => {
  if (!p) return null;
  return {
    ...p,
    id: p._id || p.id,
    _id: p._id || p.id
  };
};

export const productService = {
  // Fetch all products from backend API with filtering, search & sorting
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      if (response.data && response.data.products) {
        return {
          success: true,
          products: response.data.products.map(normalizeProduct),
          total: response.data.total || response.data.products.length,
          count: response.data.count,
          page: response.data.page || 1,
          pages: response.data.pages || 1
        };
      }
      return { success: true, products: localProducts.map(normalizeProduct), total: localProducts.length };
    } catch (error) {
      console.warn('API error in getAllProducts, falling back to local catalog:', error.message);
      // Resilient local fallback
      const filtered = productService.searchAndFilterLocal(params);
      return {
        success: true,
        products: filtered.map(normalizeProduct),
        total: filtered.length,
        fromFallback: true
      };
    }
  },

  // Fetch single product by ID from backend API
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      if (response.data && response.data.product) {
        return normalizeProduct(response.data.product);
      }
      return null;
    } catch (error) {
      console.warn(`API error in getProductById(${id}), checking local catalog:`, error.message);
      const local = localProducts.find(p => p.id === id || p._id === id);
      return local ? normalizeProduct(local) : null;
    }
  },

  // Admin: Create a new product in MongoDB
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Admin: Update existing product in MongoDB
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Admin: Delete product from MongoDB
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Admin: Upload product image file (Multer)
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Fetch all categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.categories) {
        return response.data.categories;
      }
      return localCategories;
    } catch (error) {
      return localCategories;
    }
  },

  // Synchronous local helper for instant filter operations
  searchAndFilterLocal: ({
    query = '',
    category = 'all',
    minPrice = 0,
    maxPrice = 1000,
    rating = 0,
    inStockOnly = false,
    sortBy = 'popular'
  } = {}) => {
    return localProducts.filter(item => {
      const matchesQuery = !query || 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = !category || category === 'all' || 
        (item.category && item.category.toLowerCase() === category.toLowerCase());

      const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
      const matchesRating = rating === 0 || item.rating >= rating;
      const matchesStock = !inStockOnly || item.inStock;

      return matchesQuery && matchesCategory && matchesPrice && matchesRating && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    });
  },

  getRelatedProducts: (currentProductId, category, allProducts = localProducts, limit = 4) => {
    const pool = (allProducts && allProducts.length > 0) ? allProducts : localProducts;
    return pool
      .filter(p => (p.id !== currentProductId && p._id !== currentProductId) && 
                   (!category || (p.category && p.category.toLowerCase() === category.toLowerCase())))
      .slice(0, limit)
      .map(normalizeProduct);
  }
};

export default productService;
