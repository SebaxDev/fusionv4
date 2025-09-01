import axios from 'axios'

// CAMBIAR la baseURL según el entorno
const baseURL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:8000' 
  : '/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,  // Aumentar timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
