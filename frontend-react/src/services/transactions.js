import api from '../lib/api';

export const transactionService = {
  getAll: async (params) => {
    const response = await api.get('/transactions/', { params });
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/transactions/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  }
};
