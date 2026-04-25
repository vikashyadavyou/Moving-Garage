import api from './client'

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getProfile: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  updateAvailability: (data) => api.patch('/auth/mechanic/availability/', data),
  updateLocation: (data) => api.patch('/auth/mechanic/location/', data),
  getMechanicStats: () => api.get('/auth/mechanic/stats/'),
}
