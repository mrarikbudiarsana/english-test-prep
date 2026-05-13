import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    // Unwrap { data: ... } responses from backend, unless it's a paginated response with 'total'
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      // If 'total' is present, don't unwrap - we need the metadata
      if ('total' in response.data) {
        return response;
      }
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login for non-background requests.
      // Background calls (auth checks, subscription polling) should fail silently
      // and let the AuthContext handle the sign-out flow.
      const requestUrl = error.config?.url || '';
      const silentEndpoints = ['/auth/me', '/subscriptions/current'];
      const isSilent = silentEndpoints.some(ep => requestUrl.includes(ep));

      if (
        typeof window !== 'undefined' &&
        !isSilent &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
