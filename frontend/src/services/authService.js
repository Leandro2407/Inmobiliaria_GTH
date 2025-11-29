import api from './api';
import { jwtDecode } from 'jwt-decode';

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.clear();
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.rol || null;
  },

  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.rol === 'administrador' || user?.is_staff;
  },

  isAgente: () => {
    const user = authService.getCurrentUser();
    return user?.rol === 'agente';
  },

  isCliente: () => {
    const user = authService.getCurrentUser();
    return user?.rol === 'cliente';
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile/');
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/auth/profile/', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  confirmPasswordReset: async (token, newPassword, newPassword2) => {
    try {
      const response = await api.post('/auth/password-reset/confirm/', {
        token,
        new_password: newPassword,
        new_password2: newPassword2,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.post('/auth/verify-email/', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authService;