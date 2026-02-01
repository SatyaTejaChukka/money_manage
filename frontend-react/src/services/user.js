import api from '../lib/api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    // data = { email: ... }
    const response = await api.put('/users/me', data);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (data) => {
    // data = { old_password, new_password }
    const response = await api.post('/users/me/password', data);
    return response.data;
  }
};
