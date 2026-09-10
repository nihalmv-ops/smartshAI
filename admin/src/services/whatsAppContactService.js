import api from './api';

export const whatsAppContactService = {
  // Get all WhatsApp contacts (Admin view)
  getContacts: async () => {
    const response = await api.get('/whatsapp-contacts');
    return response.data;
  },

  // Create a new WhatsApp contact
  createContact: async (data) => {
    const response = await api.post('/whatsapp-contacts', data);
    return response.data;
  },

  // Update existing contact (name, phone, purpose, active status, default)
  updateContact: async (id, data) => {
    const response = await api.put(`/whatsapp-contacts/${id}`, data);
    return response.data;
  },

  // Delete contact by ID
  deleteContact: async (id) => {
    const response = await api.delete(`/whatsapp-contacts/${id}`);
    return response.data;
  }
};

