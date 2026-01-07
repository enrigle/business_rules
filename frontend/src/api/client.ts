/**
 * API Client for Business Rules Backend
 * Base axios configuration and error handling
 */

import axios, { AxiosError } from 'axios';
import type { APIError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    // Handle common errors
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      switch (status) {
        case 400:
          console.error('Bad Request:', detail);
          break;
        case 404:
          console.error('Not Found:', detail);
          break;
        case 500:
          console.error('Server Error:', detail);
          break;
        default:
          console.error('API Error:', detail);
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server');
    } else {
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
