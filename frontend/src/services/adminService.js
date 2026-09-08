import api from './api';

export const adminService = {
  // Get aggregated dashboard KPIs and AI analytics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get all registered users
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Update a user's role (admin / customer)
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user account
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Create a new administrator account (by authorized admin)
  createAdminUser: async (adminData) => {
    const response = await api.post('/users/admin/create', adminData);
    return response.data;
  },

  // Quick adjust product stock count and inStock status
  updateStock: async (productId, stockData) => {
    const response = await api.patch(`/products/${productId}/stock`, stockData);
    return response.data;
  }
};

