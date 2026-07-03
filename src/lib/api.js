import axios from 'axios'

// ── Create Axios instance ────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor: attach JWT ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dhms_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle auth errors ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired / invalid — clear session and redirect to login
      localStorage.removeItem('dhms_token')
      localStorage.removeItem('dhms_user')
      window.location.replace('/login')
    }

    // Do NOT forcefully redirect to /error on network failures here.
    // Let React Query catch it and gracefully fall back to placeholderData (mock mode).
    
    return Promise.reject(error)
  }
)

export default api

// ── Typed API helpers ────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  logout:   (data) => api.post('/auth/logout/', data),
  me:       ()     => api.get('/auth/me/'),
  refresh:  (data) => api.post('/auth/refresh/', data),
}

export const districtsApi = {
  list:   ()   => api.get('/districts/'),
  detail: (id) => api.get(`/districts/${id}/`),
  stats:  ()   => api.get('/hospitals/district-stats/'),
}

export const hospitalsApi = {
  list:          (params)     => api.get('/hospitals/', { params }),
  detail:        (id)         => api.get(`/hospitals/${id}/`),
  footfallTrend: ()           => api.get('/hospitals/footfall-trend/'),
  bedTrend:      ()           => api.get('/hospitals/bed-trend/'),
}

export const doctorsApi = {
  list:           (hospitalId)          => api.get(`/hospitals/${hospitalId}/doctors/`),
  markAttendance: (hospitalId, docId, data) =>
    api.patch(`/hospitals/${hospitalId}/doctors/${docId}/attendance/`, data),
}

export const attendanceApi = {
  list:    (hospitalId, params) => api.get(`/hospitals/${hospitalId}/attendance/`, { params }),
  history: (hospitalId)         => api.get(`/hospitals/${hospitalId}/attendance/history/`),
}

export const stockApi = {
  list:    (hospitalId)               => api.get(`/hospitals/${hospitalId}/stock/`),
  summary: (hospitalId)               => api.get(`/hospitals/${hospitalId}/stock/summary/`),
  update:  (hospitalId, itemId, data) => api.patch(`/hospitals/${hospitalId}/stock/${itemId}/`, data),
}

export const bedsApi = {
  summary: (hospitalId) => api.get(`/hospitals/${hospitalId}/beds/`),
}

export const testsApi = {
  list:   (hospitalId)             => api.get(`/hospitals/${hospitalId}/tests/`),
  update: (hospitalId, testId, data) =>
    api.patch(`/hospitals/${hospitalId}/tests/${testId}/`, data),
}

export const appointmentsApi = {
  list:   (params)                         => api.get('/appointments/', { params }),
  book:   (data)                           => api.post('/appointments/', data),
  update: (id, data)                       => api.patch(`/appointments/${id}/`, data),
  slots:  (params)                         => api.get('/appointments/slots/', { params }),
}

export const notificationsApi = {
  list:        (params) => api.get('/notifications/', { params }),
  markRead:    (id)     => api.patch(`/notifications/${id}/read/`),
  markAllRead: ()       => api.patch('/notifications/read-all/'),
}

export const flaggedApi = {
  list:   (params)       => api.get('/flagged/', { params }),
  update: (id, data)     => api.patch(`/flagged/${id}/`, data),
}

export const aiApi = {
  insights:       (params) => api.get('/insights/', { params }),
  forecast:       (params) => api.get('/insights/forecast/', { params }),
  redistribution: (params) => api.get('/insights/redistribution/', { params }),
  flagged:        (params) => api.get('/insights/flagged/', { params }),
}

export const importApi = {
  stock:    (formData) => api.post('/import/stock/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  patients: (formData) => api.post('/import/patients/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
