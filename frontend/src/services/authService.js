import api from './api';

export const authService = {
  // Register a new user
  register: async ({ name, email, password, phone, address }) => {
    const response = await api.post('/users/register', {
      name,
      email,
      password,
      phone,
      address
    });
    return response.data;
  },

  // Register a new administrator with security passcode
  registerAdmin: async ({ name, email, password, phone, address, adminSecretKey }) => {
    const response = await api.post('/users/admin/register', {
      name,
      email,
      password,
      phone,
      address,
      adminSecretKey
    });
    return response.data;
  },

  // Login user with email and password
  login: async ({ email, password }) => {
    const response = await api.post('/users/login', {
      email,
      password
    });
    return response.data;
  },

  // Google OAuth authentication
  googleAuth: async ({ credential, client_id, userProfile }) => {
    const response = await api.post('/users/google', {
      credential,
      client_id,
      userProfile
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  }
};

