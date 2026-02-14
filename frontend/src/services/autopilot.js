import api from '../lib/api';

export const autopilotService = {
  listPayments: async (status, limit = 100) => {
    const response = await api.get('/autopilot/payments', {
      params: { status, limit },
    });
    return response.data;
  },

  preparePayments: async (daysAhead = 7) => {
    const response = await api.post('/autopilot/payments/prepare', null, {
      params: { days_ahead: daysAhead },
    });
    return response.data;
  },

  approvePayment: async (paymentId, executeNow = true) => {
    const response = await api.post(`/autopilot/payments/${paymentId}/approve`, {
      execute_now: executeNow,
    });
    return response.data;
  },

  cancelPayment: async (paymentId, reason) => {
    const response = await api.post(`/autopilot/payments/${paymentId}/cancel`, { reason });
    return response.data;
  },
};
