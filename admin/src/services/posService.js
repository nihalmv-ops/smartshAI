import api from './api';

export const posService = {
  // Search products for POS terminal (by barcode, name, SKU, category)
  getProducts: async (query = '', category = '') => {
    const params = {};
    if (query) params.query = query;
    if (category) params.category = category;
    const response = await api.get('/pos/products', { params });
    return response.data;
  },

  // Record an offline POS counter sale
  createSale: async (saleData) => {
    const response = await api.post('/pos/sale', saleData);
    return response.data;
  },

  // Get current shift POS summary
  getShiftSummary: async () => {
    const response = await api.get('/pos/shift-summary');
    return response.data;
  }
};
