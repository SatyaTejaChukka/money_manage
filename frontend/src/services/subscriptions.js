import api from '../lib/api';

export const subscriptionService = {
  getAll: async () => {
    const response = await api.get('/subscriptions/');
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/subscriptions/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
  },

  logUsage: async (id, data) => {
    const response = await api.post(`/subscriptions/${id}/log-usage`, data);
    return response.data;
  }
};
