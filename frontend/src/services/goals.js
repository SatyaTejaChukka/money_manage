import api from '../lib/api';

export const goalService = {
  getAll: async () => {
    const response = await api.get('/goals/');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/goals/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  contribute: async (id, amount) => {
      const response = await api.post(`/goals/${id}/contribute`, { amount });
      return response.data;
  },

  getLogs: async (id) => {
      const response = await api.get(`/goals/${id}/logs`);
      return response.data;
  }
};
