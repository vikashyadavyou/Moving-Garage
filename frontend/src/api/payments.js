import api from './client'

export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order/', data),
  verifyPayment: (data) => api.post('/payments/verify/', data),
  getPayment: (id) => api.get(`/payments/${id}/`),
}
