import api from '../lib/api';

export const dashboardService = {
  getSummary: async (range = 'week') => {
    const response = await api.get(`/dashboard/summary?chart_range=${range}`);
    return response.data;
  },
};
