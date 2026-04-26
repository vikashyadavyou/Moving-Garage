import api from './client'

export const servicesAPI = {
  getIssues: () => api.get('/issues/'),
  createRequest: (data) => api.post('/requests/', data),
  getRequests: (params) => api.get('/requests/list/', { params }),
  getRequestDetail: (id) => api.get(`/requests/${id}/`),
  acceptRequest: (id) => api.patch(`/requests/${id}/accept/`),
  updateStatus: (id, data) => api.patch(`/requests/${id}/status/`, data),
  diagnoseOverride: (id, data) => api.patch(`/requests/${id}/diagnose/`, data),
  approveQuote: (id) => api.post(`/requests/${id}/approve-quote/`),
  completeRequest: (id) => api.post(`/requests/${id}/complete/`),
  confirmCash: (id) => api.post(`/requests/${id}/confirm-cash/`),
  cancelRequest: (id) => api.post(`/requests/${id}/cancel/`),
}
