import axios from 'axios';

// Ensure this is exported so other files can use it
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// === Request Interceptor ===
api.interceptors.request.use(
  (config) => {
    // 1. Try to get token from "user" object (Most likely scenario)
    const userStr = localStorage.getItem('user');
    let token = null;
    
    if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token; 
    }

    // 2. Fallback: Try to get token directly (If stored as just 'token')
    if (!token) {
        token = localStorage.getItem('token');
    }

    // 3. Attach to header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;