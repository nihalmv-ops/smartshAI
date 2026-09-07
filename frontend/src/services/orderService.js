import api from './api';

export const orderService = {
  // Create a new order during checkout
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get logged-in customer's order history
  getMyOrders: async () => {
    const response = await api.get('/orders/myorders');
    return response.data;
  },

  // Get order details by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Admin: Get all orders across the platform
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Admin: Update order delivery status
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  }
};

