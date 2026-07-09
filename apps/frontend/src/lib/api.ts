import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/useAuthStore';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

// The base host without /api for static assets
export const BASE_URL = API_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = useAuthStore.getState().activeTenantId;
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId.toString();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're hitting a 401 while trying to refresh, immediately logout.
      if (originalRequest.url.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function (resolve, reject) {
        const user = useAuthStore.getState().user;
        const refreshToken = Cookies.get('refresh_token');

        if (!user || !refreshToken) {
          useAuthStore.getState().logout();
          return reject(error);
        }

        axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true })
          .then(({ data }) => {
            const newToken = data.accessToken;
            const newRefreshToken = data.refreshToken;
            
            // Apply new tokens
            useAuthStore.getState().refreshToken(newToken);
            if (newRefreshToken) {
              Cookies.set('refresh_token', newRefreshToken, { expires: 7, path: '/', sameSite: 'lax' });
            }

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            useAuthStore.getState().logout();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
