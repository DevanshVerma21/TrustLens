import axios from 'axios';
import { tokenStore, authService } from './authService.js';

const BASE_URL = 'http://localhost:5000/api';

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: BASE_URL });

// Attach Authorization header on every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh access token on 401 TokenExpired
let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.error === 'TokenExpired' &&
      !originalRequest._retry;

    if (!isTokenExpired) return Promise.reject(error);

    if (isRefreshing) {
      // Queue additional requests while a refresh is in-flight
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await authService.refreshAccessToken();
      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — clear session and redirect to login
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Transaction API ───────────────────────────────────────────────────────────

export const transactionAPI = {
  submit: (data) =>
    api.post('/transactions', data),

  getTransactions: (userId, limit = 10, offset = 0) =>
    api.get(`/transactions/user/${userId}`, { params: { limit, offset } }),

  getTrustScore: (userId) =>
    api.get(`/transactions/trust-score/${userId}`),

  getFraudLog: (transactionId) =>
    api.get(`/transactions/fraud-log/${transactionId}`),

  health: () =>
    api.get('/health'),
};

export default api;
