import api from './api';

export const expenseService = {
  // Get expenses with optional filters
  getExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Record a new expense
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Delete an expense
  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  }
};

