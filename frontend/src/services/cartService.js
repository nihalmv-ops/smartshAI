import api from './api';

export const cartService = {
  // Fetch user's cart from MongoDB
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cart from backend:', error.message);
      return { success: false, cart: [] };
    }
  },

  // Save/sync cart items with MongoDB
  saveCart: async (items) => {
    try {
      const response = await api.post('/cart', { items });
      return response.data;
    } catch (error) {
      console.error('Failed to sync cart to backend:', error.message);
      return { success: false };
    }
  },

  // Clear user's cart in MongoDB
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error) {
      console.error('Failed to clear cart in backend:', error.message);
      return { success: false };
    }
  }
};

