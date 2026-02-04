import api from '../lib/api';

export const billService = {
  getAll: async () => {
    const response = await api.get('/bills/');
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/bills/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },

  markPaid: async (id) => {
    const response = await api.post(`/bills/${id}/mark-paid`);
    return response.data;
  }
};
