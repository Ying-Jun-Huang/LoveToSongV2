import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials) => {
    try {
      const response = await api.post('/auth/register', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
  },
  
  getCurrentUser: (): User | null => {
    // 先嘗試新的userInfo格式
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        return {
          id: userInfo.id,
          email: userInfo.email,
          username: userInfo.displayName || userInfo.email
        };
      } catch (e) {
        console.error('Failed to parse userInfo:', e);
      }
    }
    
    // 回退到舊的user格式
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    // 檢查是否有認證資訊且不是訪客用戶
    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return !user.roles || !user.roles.includes('GUEST');
      } catch (e) {
        console.error('Failed to parse userInfo:', e);
        return false;
      }
    }
    
    return !!token;
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('token');
  }
};
