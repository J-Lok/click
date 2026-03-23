import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1';

const baseURL =
  API_BASE && API_BASE.trim()
    ? `${API_BASE.replace(/\/$/, '')}${API_PREFIX}`
    : import.meta.env.DEV
      ? `http://localhost:8000${API_PREFIX}`
      : '';

if (import.meta.env.PROD && !baseURL) {
  throw new Error('VITE_API_BASE_URL must be set in production');
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', data.access_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
