import api from './api';

export const defaultSettings = {
  storeName: 'Skyline Mart',
  deliveryFee: 25,
  freeDeliveryThreshold: 199,
  deliveryEstimatedMinutes: 15,
  topBannerText: 'Get 20% OFF on your first grocery order with code FRESH20'
};

export const settingsService = {
  // Get active store settings
  async getSettings() {
    try {
      const res = await api.get('/settings');
      return res.data?.settings || defaultSettings;
    } catch (err) {
      console.warn('Using local default settings fallback:', err.message);
      return defaultSettings;
    }
  },

  // Update store settings (Delivery Fee, Threshold, etc.)
  async updateSettings(data) {
    const res = await api.put('/settings', data);
    return res.data;
  }
};

export default settingsService;
