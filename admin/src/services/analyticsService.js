import api from './api';

export const analyticsService = {
  // Get sales overview & financial totals
  getSalesOverview: async (params = {}) => {
    const response = await api.get('/analytics/sales', { params });
    return response.data;
  },

  // Get time series chart data (7d, 30d, 3m, 6m, 1y)
  getSalesChart: async (period = '30d') => {
    const response = await api.get('/analytics/chart', { params: { period } });
    return response.data;
  },

  // Get business growth rates
  getGrowth: async () => {
    const response = await api.get('/analytics/growth');
    return response.data;
  },

  // Get customer retention and top customer metrics
  getCustomers: async () => {
    const response = await api.get('/analytics/customers');
    return response.data;
  },

  // Get best-selling products rankable by units, revenue, or profit
  getTopProducts: async (sortBy = 'units', limit = 10) => {
    const response = await api.get('/analytics/top-products', { params: { sortBy, limit } });
    return response.data;
  },

  // Get category sales and profit breakdown
  getCategories: async () => {
    const response = await api.get('/analytics/categories');
    return response.data;
  },

  // Get business health metrics
  getBusinessHealth: async () => {
    const response = await api.get('/analytics/health');
    return response.data;
  },

  // Get AI business insights
  getAIInsights: async () => {
    const response = await api.get('/analytics/ai-insights');
    return response.data;
  },

  // Get structured report data
  getReportData: async (params = {}) => {
    const response = await api.get('/analytics/reports', { params });
    return response.data;
  }
};

