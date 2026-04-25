import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('mg_tokens')
    if (tokens) {
      const { access } = JSON.parse(tokens)
      config.headers.Authorization = `Bearer ${access}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const tokens = JSON.parse(localStorage.getItem('mg_tokens') || '{}')
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh/`, {
          refresh: tokens.refresh,
        })

        const newTokens = {
          access: response.data.access,
          refresh: response.data.refresh || tokens.refresh,
        }
        localStorage.setItem('mg_tokens', JSON.stringify(newTokens))

        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('mg_tokens')
        localStorage.removeItem('mg_user')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
