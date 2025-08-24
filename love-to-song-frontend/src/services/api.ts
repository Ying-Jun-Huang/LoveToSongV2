import axios from 'axios';
import { setupMockApi, isMockAuth } from './mockApi';

// Initialize mock API system
setupMockApi();

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('[API] Response error:', error.response?.status, error.response?.data);
    
    // Mock responses are handled by fetch override in mockApi.ts
    
    if (error.response?.status === 401) {
      // 檢查當前用戶是否為訪客用戶
      const userInfo = localStorage.getItem('userInfo');
      const token = localStorage.getItem('token');
      let isGuestUser = false;
      
      console.log('[API] 401 Error - UserInfo exists:', !!userInfo, 'Token exists:', !!token);
      
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          isGuestUser = user.roles && user.roles.includes('GUEST');
          console.log('[API] User roles:', user.roles, 'IsGuest:', isGuestUser);
        } catch (e) {
          console.error('[API] Failed to parse user info:', e);
        }
      }
      
      // 如果是模擬認證，不要清除 token
      if (isMockAuth()) {
        console.log('[API] 401 with mock auth - keeping mock session');
        return Promise.reject(error);
      }
      
      // 如果是訪客用戶，不要自動跳轉到登入頁面
      if (!isGuestUser && token) {
        console.warn('[API] Non-guest user with 401 error - keeping session to prevent logout on refresh');
        console.warn('[API] This might be due to backend API unavailable or different auth requirements');
        // 不清除 localStorage，防止頁面刷新時登出
        // localStorage.removeItem('token');
        // localStorage.removeItem('userInfo');
      } else {
        // 訪客用戶遇到 401，只記錄錯誤但不跳轉
        console.warn('[API] API call failed for guest user or no token - 401 unauthorized');
      }
    }
    return Promise.reject(error);
  }
);

export default api;