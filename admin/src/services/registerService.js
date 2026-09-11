import api from './api';

export const registerService = {
  // Get today's active cash register status & live cash sales
  getTodayRegister: async () => {
    const response = await api.get('/register/today');
    return response.data;
  },

  // Open register with shift opening cash
  openRegister: async (openingCash) => {
    const response = await api.post('/register/open', { openingCash });
    return response.data;
  },

  // Record cash withdrawal from register
  recordWithdrawal: async (amount, notes = '') => {
    const response = await api.post('/register/withdrawal', { amount, notes });
    return response.data;
  },

  // Close daily register with physical count
  closeRegister: async (actualClosingCash, notes = '') => {
    const response = await api.post('/register/close', { actualClosingCash, notes });
    return response.data;
  },

  // Get historical register closing records
  getHistory: async () => {
    const response = await api.get('/register/history');
    return response.data;
  }
};

