import api from './api';

export const whatsAppContactService = {
  // Get active WhatsApp contacts configured for the store
  getActiveContacts: async () => {
    try {
      const response = await api.get('/whatsapp-contacts');
      return response.data?.contacts || [];
    } catch (err) {
      console.warn('Could not fetch WhatsApp contacts from API, fallback available:', err.message);
      return [];
    }
  }
};

