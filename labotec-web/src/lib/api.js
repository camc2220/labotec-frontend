import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')

  if (!config.headers) {
    config.headers = {}
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

// Si el backend devuelve 401/403, limpiamos sesión y mandamos al login
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status

    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('auth:user')

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
